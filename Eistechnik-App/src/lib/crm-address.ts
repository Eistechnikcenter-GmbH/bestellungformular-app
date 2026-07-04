import type { CrmRow, PartnerContact } from "./odoo-crm";

export function firstNonEmpty(
  ...values: (string | undefined | null)[]
): string {
  for (const v of values) {
    const s = v != null ? String(v).trim() : "";
    if (s) return s;
  }
  return "";
}

/** Build a routable address: contact (partner) first, then CRM lead fields. */
export function compactCrmAddress(lead: CrmRow): string {
  const p = lead.partner;
  const street = firstNonEmpty(p?.street, lead.street);
  const street2 = firstNonEmpty(p?.street2, lead.street2);
  const zip = firstNonEmpty(p?.zip, lead.zip);
  const city = firstNonEmpty(p?.city, lead.city);

  const parts = [street, street2, [zip, city].filter(Boolean).join(" ")]
    .filter(Boolean)
    .join(", ");
  if (!parts) return "";
  const lower = parts.toLowerCase();
  if (lower.includes("deutschland") || lower.includes("germany")) {
    return parts;
  }
  return `${parts}, Deutschland`;
}

export function crmLeadLabel(lead: CrmRow): string {
  return (
    firstNonEmpty(
      lead.partner?.name,
      lead.partner_name,
      lead.contact_name,
      lead.name
    ) || `Lead #${lead.id}`
  );
}

export function partnerHasUsableAddress(partner: PartnerContact | undefined): boolean {
  if (!partner) return false;
  return Boolean(
    firstNonEmpty(partner.street, partner.zip, partner.city)
  );
}
