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
  "parent_id",
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

function firstNonEmpty(
  ...values: (string | undefined | null)[]
): string | undefined {
  for (const v of values) {
    const s = v != null ? String(v).trim() : "";
    if (s) return s;
  }
  return undefined;
}

function relationId(
  value: string | number | [number, string] | false | null | undefined
): number | null {
  if (value == null || value === false) return null;
  if (typeof value === "number") return value;
  if (Array.isArray(value) && typeof value[0] === "number") return value[0];
  return null;
}

function partnerRowToContact(
  p: OdooPartnerRow,
  parentById: Map<number, PartnerContact>
): PartnerContact {
  const parentId = relationId(p.parent_id);
  const parent = parentId != null ? parentById.get(parentId) : undefined;

  return {
    name: strOrUndef(p.name),
    street: firstNonEmpty(strOrUndef(p.street), parent?.street),
    street2: firstNonEmpty(strOrUndef(p.street2), parent?.street2),
    city: firstNonEmpty(strOrUndef(p.city), parent?.city),
    zip: firstNonEmpty(strOrUndef(p.zip), parent?.zip),
    email: firstNonEmpty(strOrUndef(p.email), parent?.email),
    phone: firstNonEmpty(strOrUndef(p.phone), parent?.phone),
    geburtstag: strOrUndef(p.x_studio_geburtstag),
  };
}

function partnerHasAddress(contact: PartnerContact): boolean {
  return Boolean(
    firstNonEmpty(contact.street, contact.zip, contact.city)
  );
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

  const partnerMap: Map<number, PartnerContact> = new Map();
  if (uniqueIds.length > 0) {
    const partners = await odooSearchRead<OdooPartnerRow>("res.partner", {
      domain: [["id", "in", uniqueIds]],
      fields: [...PARTNER_FIELDS],
    });

    const parentIds = [
      ...new Set(
        partners
          .map((p) => relationId(p.parent_id))
          .filter((id): id is number => id != null && !uniqueIds.includes(id))
      ),
    ];

    const parentRows =
      parentIds.length > 0
        ? await odooSearchRead<OdooPartnerRow>("res.partner", {
            domain: [["id", "in", parentIds]],
            fields: [...PARTNER_FIELDS],
          })
        : [];

    const parentById = new Map<number, PartnerContact>();
    for (const p of parentRows) {
      const id = typeof p.id === "number" ? p.id : null;
      if (id == null) continue;
      parentById.set(id, partnerRowToContact(p, new Map()));
    }

    for (const p of partners) {
      const id = typeof p.id === "number" ? p.id : null;
      if (id == null) continue;
      partnerMap.set(id, partnerRowToContact(p, parentById));
    }

    const companiesWithoutAddress = partners
      .map((p) => (typeof p.id === "number" ? p.id : null))
      .filter((id): id is number => {
        if (id == null) return false;
        const contact = partnerMap.get(id);
        return contact != null && !partnerHasAddress(contact);
      });

    if (companiesWithoutAddress.length > 0) {
      const childContacts = await odooSearchRead<OdooPartnerRow>("res.partner", {
        domain: [["parent_id", "in", companiesWithoutAddress]],
        fields: [...PARTNER_FIELDS],
        limit: companiesWithoutAddress.length * 5,
      });

      for (const companyId of companiesWithoutAddress) {
        const child = childContacts.find(
          (c) => relationId(c.parent_id) === companyId && partnerHasAddress(partnerRowToContact(c, parentById))
        );
        if (!child) continue;
        const childContact = partnerRowToContact(child, parentById);
        const existing = partnerMap.get(companyId);
        partnerMap.set(companyId, {
          name: firstNonEmpty(existing?.name, childContact.name),
          street: firstNonEmpty(existing?.street, childContact.street),
          street2: firstNonEmpty(existing?.street2, childContact.street2),
          city: firstNonEmpty(existing?.city, childContact.city),
          zip: firstNonEmpty(existing?.zip, childContact.zip),
          email: firstNonEmpty(existing?.email, childContact.email),
          phone: firstNonEmpty(existing?.phone, childContact.phone),
          geburtstag: existing?.geburtstag ?? childContact.geburtstag,
        });
      }
    }
  }

  return raw.map((r) => {
    const pid = partnerIdFromLead(r.partner_id);
    const partner = pid != null ? partnerMap.get(pid) : undefined;
    const { partner_id, ...rest } = r;
    return { ...rest, partner_id, partner } as CrmRow;
  });
}
