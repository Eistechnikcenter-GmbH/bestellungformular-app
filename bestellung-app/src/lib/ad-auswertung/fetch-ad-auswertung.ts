import { odooSearchCount, odooSearchRead } from "../odoo-client";
import {
  AGL_PARTNER_ID,
  EIGEN_CATEGORY,
  KLAERUNG_CATEGORY,
  FUZZY_MATCH_THRESHOLD,
  KALT_KONTAKT_TAG,
  STORNO_INVOICE_PREFIX,
} from "./constants";
import {
  extractLeasingSearchTerms,
  findBestPartnerMatch,
  scorePartnerMatch,
} from "./fuzzy-match";
import { combinedStatusLabel } from "./invoice-status";
import {
  buildChannelSummary,
  buildSourceSummary,
  invoicesForCalculation,
} from "./summaries";
import type {
  AdAuswertungFilters,
  AdAuswertungResult,
  InvoiceChannel,
  ProcessedInvoice,
  TagSource,
} from "./types";

type OdooInvoiceRow = {
  id: number;
  name: string | false;
  partner_id: [number, string] | false;
  invoice_date: string | false;
  amount_total: number;
  amount_untaxed: number;
  state: string;
  payment_state: string;
  x_studio_leasing_kunde: string | false;
  move_type: string;
};

type OdooPartnerRow = {
  id: number;
  name: string;
  category_id: number[] | false;
};

type OdooTagRow = {
  id: number;
  name: string;
};

type OdooPartnerCategoryRow = {
  id: number;
  name: string;
};

type OdooLeadRow = {
  id: number;
  name?: string;
  partner_id: number | [number, string] | false;
  tag_ids: number[] | false;
  create_date?: string;
};

const CRM_LEAD_NAME_MATCH_THRESHOLD = 0.85;

function relationId(
  value: number | [number, string] | false | null | undefined
): number | null {
  if (value == null || value === false) return null;
  if (typeof value === "number") return value;
  if (Array.isArray(value) && typeof value[0] === "number") return value[0];
  return null;
}

function str(value: string | false | null | undefined): string {
  if (value === false || value == null) return "";
  return String(value);
}

function isAglInvoice(partnerId: number | null): boolean {
  return partnerId === AGL_PARTNER_ID;
}

function isStornoInvoice(name: string | false | null | undefined): boolean {
  const n = str(name);
  return n.startsWith(STORNO_INVOICE_PREFIX);
}

function buildInvoiceDomain(filters: AdAuswertungFilters): unknown[] {
  return [
    ["move_type", "in", ["out_invoice", "out_refund"]],
    ["state", "!=", "cancel"],
    ["name", "not ilike", `${STORNO_INVOICE_PREFIX}%`],
    ["invoice_date", ">=", filters.dateFrom],
    ["invoice_date", "<=", filters.dateTo],
  ];
}

/** Include customers, tagged contacts, and direct invoice partners (some walk-ins have customer_rank 0). */
function buildPartnerDomain(directInvoicePartnerIds: number[]): unknown[] {
  const terms: unknown[] = [
    ["customer_rank", ">", 0],
    ["category_id", "!=", false],
  ];
  if (directInvoicePartnerIds.length > 0) {
    terms.push(["id", "in", directInvoicePartnerIds]);
  }
  if (terms.length === 1) return terms[0] as unknown[];
  return [...Array(terms.length - 1).fill("|"), ...terms];
}

function buildNameSearchDomain(searchTerms: string[]): unknown[] | null {
  const unique = [...new Set(searchTerms.map((t) => t.trim()).filter((t) => t.length >= 4))];
  if (unique.length === 0) return null;
  if (unique.length === 1) return [["name", "ilike", unique[0]]];
  const clauses = unique.map((term) => ["name", "ilike", term] as unknown[]);
  return [...Array(clauses.length - 1).fill("|"), ...clauses];
}

async function fetchLeasingPartnerCandidates(
  leasingTexts: string[],
  existing: OdooPartnerRow[]
): Promise<OdooPartnerRow[]> {
  const allTerms = new Set<string>();
  for (const text of leasingTexts) {
    for (const term of extractLeasingSearchTerms(text)) {
      allTerms.add(term);
    }
  }

  const domain = buildNameSearchDomain([...allTerms]);
  if (!domain) return existing;

  const extra = await odooSearchRead<OdooPartnerRow>("res.partner", {
    domain,
    fields: ["id", "name", "category_id"],
    limit: 150,
  });

  const byId = new Map<number, OdooPartnerRow>();
  for (const partner of [...existing, ...extra]) {
    if (partner.id !== AGL_PARTNER_ID) {
      byId.set(partner.id, partner);
    }
  }
  return Array.from(byId.values());
}

function buildPartnerTagMap(
  leads: OdooLeadRow[],
  tagNameById: Map<number, string>
): Map<number, { leadId: number; tags: string[] }> {
  const sorted = [...leads].sort((a, b) => {
    const da = a.create_date ?? "";
    const db = b.create_date ?? "";
    return db.localeCompare(da);
  });

  const map = new Map<number, { leadId: number; tags: string[] }>();
  for (const lead of sorted) {
    const partnerId = relationId(lead.partner_id);
    if (partnerId == null) continue;
    if (map.has(partnerId)) continue;

    const tagIds = Array.isArray(lead.tag_ids) ? lead.tag_ids : [];
    const tags = tagIds
      .map((id) => tagNameById.get(id))
      .filter((name): name is string => Boolean(name));

    map.set(partnerId, { leadId: lead.id, tags });
  }
  return map;
}

function buildPartnerCategoryMap(
  partners: OdooPartnerRow[],
  categoryNameById: Map<number, string>
): Map<number, string[]> {
  const map = new Map<number, string[]>();
  for (const partner of partners) {
    const categoryIds = Array.isArray(partner.category_id) ? partner.category_id : [];
    const names = categoryIds
      .map((id) => categoryNameById.get(id))
      .filter((name): name is string => Boolean(name));
    if (names.length > 0) {
      map.set(partner.id, names);
    }
  }
  return map;
}

type CrmLeadNameMatch = {
  leadId: number;
  tags: string[];
  partnerId: number | null;
  score: number;
};

function leadTags(lead: OdooLeadRow, tagNameById: Map<number, string>): string[] {
  const tagIds = Array.isArray(lead.tag_ids) ? lead.tag_ids : [];
  return tagIds
    .map((id) => tagNameById.get(id))
    .filter((name): name is string => Boolean(name));
}

function findCrmLeadByName(
  leasingText: string | null,
  leads: OdooLeadRow[],
  tagNameById: Map<number, string>
): CrmLeadNameMatch | null {
  if (!leasingText?.trim()) return null;

  let best: CrmLeadNameMatch | null = null;
  for (const lead of leads) {
    const leadName = str(lead.name as string | false | undefined);
    if (!leadName) continue;
    const score = scorePartnerMatch(leasingText, leadName);
    if (score < CRM_LEAD_NAME_MATCH_THRESHOLD) continue;

    const match: CrmLeadNameMatch = {
      leadId: lead.id,
      tags: leadTags(lead, tagNameById),
      partnerId: relationId(lead.partner_id),
      score,
    };

    if (!best || score > best.score) {
      best = match;
    }
  }
  return best;
}

function resolveInvoiceTags(
  endCustomerPartnerId: number | null,
  unmatched: boolean,
  leasingKunde: string | null,
  partnerTagMap: Map<number, { leadId: number; tags: string[] }>,
  partnerCategoryMap: Map<number, string[]>,
  leads: OdooLeadRow[],
  tagNameById: Map<number, string>,
  crmMatchByName: CrmLeadNameMatch | null = null
): { tags: string[]; tagSource: TagSource; crmLeadId: number | null; autoAssignedKaltKontakt: boolean } {
  if (unmatched) {
    return { tags: [], tagSource: "none", crmLeadId: null, autoAssignedKaltKontakt: false };
  }

  if (crmMatchByName && crmMatchByName.tags.length > 0) {
    return {
      tags: crmMatchByName.tags,
      tagSource: "crm",
      crmLeadId: crmMatchByName.leadId,
      autoAssignedKaltKontakt: false,
    };
  }

  const crmLink =
    endCustomerPartnerId != null ? partnerTagMap.get(endCustomerPartnerId) : undefined;
  if (crmLink && crmLink.tags.length > 0) {
    return {
      tags: crmLink.tags,
      tagSource: "crm",
      crmLeadId: crmLink.leadId,
      autoAssignedKaltKontakt: false,
    };
  }

  const crmByName = crmMatchByName ?? findCrmLeadByName(leasingKunde, leads, tagNameById);
  if (crmByName && crmByName.tags.length > 0) {
    return {
      tags: crmByName.tags,
      tagSource: "crm",
      crmLeadId: crmByName.leadId,
      autoAssignedKaltKontakt: false,
    };
  }

  const contactTags =
    endCustomerPartnerId != null
      ? (partnerCategoryMap.get(endCustomerPartnerId) ?? [])
      : [];
  if (contactTags.length > 0) {
    return {
      tags: contactTags,
      tagSource: "contact",
      crmLeadId: null,
      autoAssignedKaltKontakt: false,
    };
  }

  return {
    tags: [KALT_KONTAKT_TAG],
    tagSource: "auto_kalt_kontakt",
    crmLeadId: null,
    autoAssignedKaltKontakt: true,
  };
}

function mergeAvailableTagNames(
  crmTags: OdooTagRow[],
  partnerCategories: OdooPartnerCategoryRow[]
): string[] {
  const names = new Set<string>();
  for (const tag of crmTags) names.add(tag.name);
  for (const cat of partnerCategories) names.add(cat.name);
  return Array.from(names).sort((a, b) => a.localeCompare(b, "de"));
}

function applyClientFilters(
  invoices: ProcessedInvoice[],
  filters: AdAuswertungFilters
): ProcessedInvoice[] {
  return invoices.filter((inv) => {
    if (inv.amountTotal < filters.minAmount) return false;
    if (filters.channelFilter !== "all" && inv.channel !== filters.channelFilter) {
      return false;
    }
    if (filters.tagFilter) {
      if (!inv.tags.includes(filters.tagFilter)) return false;
    }
    return true;
  });
}

function hasPartnerCategory(
  partnerId: number | null,
  partnerCategoryMap: Map<number, string[]>,
  categoryName: string
): boolean {
  if (partnerId == null) return false;
  const categories = partnerCategoryMap.get(partnerId) ?? [];
  return categories.includes(categoryName);
}

/**
 * Fetch invoices from Odoo, resolve end customers (incl. AGL fuzzy match),
 * link CRM tags, and build summaries for the Ad-Auswertung dashboard.
 */
export async function fetchAdAuswertung(
  filters: AdAuswertungFilters
): Promise<AdAuswertungResult> {
  const invoiceDomain = buildInvoiceDomain(filters);

  const count = await odooSearchCount("account.move", { domain: invoiceDomain });
  if (count === 0) {
    const [tags, partnerCategories] = await Promise.all([
      odooSearchRead<OdooTagRow>("crm.tag", {
        fields: ["id", "name"],
        order: "name asc",
      }),
      odooSearchRead<OdooPartnerCategoryRow>("res.partner.category", {
        fields: ["id", "name"],
        order: "name asc",
        limit: 500,
      }),
    ]);
    return {
      invoices: [],
      availableTags: mergeAvailableTagNames(tags, partnerCategories),
      unmatchedLeasingCustomers: [],
      sourceSummary: [],
      channelSummary: buildChannelSummary([]),
      eigenInvoiceCount: 0,
      klaerungInvoiceCount: 0,
    };
  }

  const rawInvoices = await odooSearchRead<OdooInvoiceRow>("account.move", {
    domain: invoiceDomain,
    fields: [
      "id",
      "name",
      "partner_id",
      "invoice_date",
      "amount_total",
      "amount_untaxed",
      "state",
      "payment_state",
      "x_studio_leasing_kunde",
      "move_type",
    ],
    limit: count,
    order: "invoice_date desc",
  });

  const directInvoicePartnerIds = [
    ...new Set(
      rawInvoices
        .map((row) => relationId(row.partner_id))
        .filter((id): id is number => id != null && id !== AGL_PARTNER_ID)
    ),
  ];

  const [partners, tags, partnerCategories, leads] = await Promise.all([
    odooSearchRead<OdooPartnerRow>("res.partner", {
      domain: buildPartnerDomain(directInvoicePartnerIds),
      fields: ["id", "name", "category_id"],
      limit: 1000,
    }),
    odooSearchRead<OdooTagRow>("crm.tag", {
      fields: ["id", "name"],
      order: "name asc",
    }),
    odooSearchRead<OdooPartnerCategoryRow>("res.partner.category", {
      fields: ["id", "name"],
      order: "name asc",
      limit: 500,
    }),
    odooSearchRead<OdooLeadRow>("crm.lead", {
      domain: [["type", "=", "opportunity"]],
      fields: ["id", "name", "partner_id", "tag_ids", "create_date"],
      limit: 5000,
      order: "create_date desc",
    }),
  ]);

  const aglLeasingTexts = rawInvoices
    .filter((row) => isAglInvoice(relationId(row.partner_id)))
    .map((row) => str(row.x_studio_leasing_kunde))
    .filter(Boolean);

  const matchPartners = await fetchLeasingPartnerCandidates(aglLeasingTexts, partners);
  const tagNameById = new Map(tags.map((t) => [t.id, t.name]));
  const categoryNameById = new Map(partnerCategories.map((c) => [c.id, c.name]));
  const partnerTagMap = buildPartnerTagMap(leads, tagNameById);
  const partnerCategoryMap = buildPartnerCategoryMap(matchPartners, categoryNameById);
  const partnerNameById = new Map(matchPartners.map((p) => [p.id, p.name]));

  const processed: ProcessedInvoice[] = [];
  const unmatchedLeasingCustomers: string[] = [];

  for (const row of rawInvoices) {
    if (row.state === "cancel" || isStornoInvoice(row.name)) continue;

    const partnerId = relationId(row.partner_id);
    const invoicePartnerName = Array.isArray(row.partner_id) ? row.partner_id[1] : "";
    const channel: InvoiceChannel = isAglInvoice(partnerId) ? "agl" : "direct";
    const leasingKunde = str(row.x_studio_leasing_kunde) || null;

    let endCustomerPartnerId: number | null = null;
    let endCustomerName = "";
    let matchScore: number | null = null;
    let unmatched = false;

    let crmMatchByName: CrmLeadNameMatch | null = null;

    if (channel === "agl") {
      if (leasingKunde) {
        crmMatchByName = findCrmLeadByName(leasingKunde, leads, tagNameById);

        if (crmMatchByName) {
          endCustomerName = leasingKunde;
          endCustomerPartnerId = crmMatchByName.partnerId;
          matchScore = crmMatchByName.score;
        } else {
          const match = findBestPartnerMatch(
            leasingKunde,
            matchPartners,
            FUZZY_MATCH_THRESHOLD
          );
          if (match) {
            endCustomerPartnerId = match.partnerId;
            endCustomerName = match.partnerName;
            matchScore = match.score;
          } else {
            endCustomerName = leasingKunde;
            unmatched = true;
            if (!unmatchedLeasingCustomers.includes(leasingKunde)) {
              unmatchedLeasingCustomers.push(leasingKunde);
            }
          }
        }
      } else {
        endCustomerName = "— (kein Leasing-Kunde)";
        unmatched = true;
      }
    } else if (partnerId != null) {
      endCustomerPartnerId = partnerId;
      endCustomerName = partnerNameById.get(partnerId) ?? invoicePartnerName;
    } else {
      endCustomerName = invoicePartnerName || "—";
      unmatched = true;
    }

    const { tags: invoiceTags, tagSource, crmLeadId, autoAssignedKaltKontakt } =
      resolveInvoiceTags(
        endCustomerPartnerId,
        unmatched,
        leasingKunde,
        partnerTagMap,
        partnerCategoryMap,
        leads,
        tagNameById,
        crmMatchByName
      );

    const amountTotal = row.amount_total ?? 0;
    const amountUntaxed = row.amount_untaxed ?? 0;
    const isEigenCompany = hasPartnerCategory(
      endCustomerPartnerId,
      partnerCategoryMap,
      EIGEN_CATEGORY
    );
    const isInKlaerung = hasPartnerCategory(
      endCustomerPartnerId,
      partnerCategoryMap,
      KLAERUNG_CATEGORY
    );

    processed.push({
      id: row.id,
      number: str(row.name) || `ID ${row.id}`,
      invoiceDate: str(row.invoice_date),
      invoicePartnerName,
      channel,
      leasingKunde,
      endCustomerName,
      endCustomerPartnerId,
      matchScore,
      unmatched,
      amountTotal,
      amountUntaxed,
      taxAmount: amountTotal - amountUntaxed,
      state: row.state,
      paymentState: row.payment_state,
      statusLabel: combinedStatusLabel(row.state, row.payment_state),
      tags: invoiceTags,
      tagSource,
      autoAssignedKaltKontakt,
      crmLeadId,
      isEigenCompany,
      isInKlaerung,
    });
  }

  const filtered = applyClientFilters(processed, filters);
  const forCalculation = invoicesForCalculation(filtered, {
    includeEigenCompanies: false,
    includeInKlaerung: false,
  });

  return {
    invoices: filtered,
    availableTags: mergeAvailableTagNames(tags, partnerCategories),
    unmatchedLeasingCustomers: unmatchedLeasingCustomers.filter((name) =>
      filtered.some((i) => i.leasingKunde === name && i.unmatched)
    ),
    sourceSummary: buildSourceSummary(forCalculation),
    channelSummary: buildChannelSummary(forCalculation),
    eigenInvoiceCount: filtered.filter((i) => i.isEigenCompany).length,
    klaerungInvoiceCount: filtered.filter((i) => i.isInKlaerung).length,
  };
}
