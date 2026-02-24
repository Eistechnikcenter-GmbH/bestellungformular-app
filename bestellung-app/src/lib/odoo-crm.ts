import { odooSearchCount, odooSearchRead } from "./odoo-client";

/** Contact (res.partner) data used to fill the buyer form from the contact card. */
export type PartnerContact = {
  name?: string;
  street?: string;
  street2?: string;
  city?: string;
  zip?: string;
  email?: string;
  phone?: string;
  /** Mobile number if Odoo exposes it (e.g. mobile_phone); we do not request 'mobile' by default. */
  mobile?: string;
  /** Birthday from Odoo Studio field x_studio_geburtstag (date, format YYYY-MM-DD). */
  geburtstag?: string;
};

export type CrmRow = {
  id: number;
  name?: string;
  partner_name?: string;
  contact_name?: string;
  email_from?: string;
  phone?: string;
  street?: string;
  street2?: string;
  city?: string;
  zip?: string;
  stage_id?: [number, string];
  user_id?: [number, string];
  create_date?: string;
  /** Linked contact (res.partner) id from crm.lead.partner_id. */
  partner_id?: number | [number, string];
  /** Filled from res.partner when partner_id is set; used to populate form from contact card. */
  partner?: PartnerContact;
};

/** CRM Opportunities (Verkaufschance, type='opportunity'). Leads are type='lead'. */
const CRM_OPPORTUNITY_DOMAIN: [string, string, string][] = [["type", "=", "opportunity"]];

const CRM_LEAD_FIELDS = [
  "id",
  "name",
  "partner_id",
  "partner_name",
  "contact_name",
  "email_from",
  "phone",
  "street",
  "street2",
  "city",
  "zip",
  "stage_id",
  "user_id",
  "create_date",
] as const;

const PARTNER_FIELDS = [
  "id",
  "name",
  "street",
  "street2",
  "city",
  "zip",
  "email",
  "phone",
  "x_studio_geburtstag",
] as const;

type OdooPartnerRow = Record<(typeof PARTNER_FIELDS)[number], string | number | false | null | undefined>;

function partnerIdFromLead(partner_id: CrmRow["partner_id"]): number | null {
  if (partner_id == null) return null;
  if (typeof partner_id === "number") return partner_id;
  if (Array.isArray(partner_id) && typeof partner_id[0] === "number") return partner_id[0];
  return null;
}

function strOrUndef(v: string | number | false | null | undefined): string | undefined {
  if (v === false || v === null || v === undefined) return undefined;
  return typeof v === "string" ? v : String(v);
}

/**
 * Fetch all CRM opportunities (Verkaufschance) from Odoo in real time.
 * For each lead with a linked contact (partner_id), loads res.partner and attaches
 * contact card data so the form can be filled from the contact, not only from lead fields.
 */
export async function fetchCrmLeads(): Promise<CrmRow[]> {
  const count = await odooSearchCount("crm.lead", { domain: CRM_OPPORTUNITY_DOMAIN });
  if (count === 0) return [];
  const raw = await odooSearchRead<CrmRow & { partner_id?: number | [number, string] }>(
    "crm.lead",
    {
      domain: CRM_OPPORTUNITY_DOMAIN,
      fields: [...CRM_LEAD_FIELDS],
      limit: count,
      order: "create_date desc",
    }
  );

  const ids = raw
    .map((r) => partnerIdFromLead(r.partner_id))
    .filter((id): id is number => id != null);
  const uniqueIds = [...new Set(ids)];

  let partnerMap: Map<number, PartnerContact> = new Map();
  if (uniqueIds.length > 0) {
    const partners = await odooSearchRead<OdooPartnerRow>("res.partner", {
      domain: [["id", "in", uniqueIds]],
      fields: [...PARTNER_FIELDS],
    });
    for (const p of partners) {
      const id = typeof p.id === "number" ? p.id : null;
      if (id == null) continue;
      partnerMap.set(id, {
        name: strOrUndef(p.name),
        street: strOrUndef(p.street),
        street2: strOrUndef(p.street2),
        city: strOrUndef(p.city),
        zip: strOrUndef(p.zip),
        email: strOrUndef(p.email),
        phone: strOrUndef(p.phone),
        geburtstag: strOrUndef((p as Record<string, unknown>).x_studio_geburtstag),
      });
    }
  }

  return raw.map((r) => {
    const pid = partnerIdFromLead(r.partner_id);
    const partner = pid != null ? partnerMap.get(pid) : undefined;
    const { partner_id, ...rest } = r;
    return { ...rest, partner_id, partner } as CrmRow;
  });
}
