import { odooSearchCount, odooSearchRead } from "./odoo-client";

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
};

/** CRM Opportunities (Verkaufschance, type='opportunity'). Leads are type='lead'. */
const CRM_OPPORTUNITY_DOMAIN: [string, string, string][] = [["type", "=", "opportunity"]];

/**
 * Fetch all CRM opportunities (Verkaufschance) from Odoo in real time.
 * Shows type='opportunity' (sales pipeline), not Leads (type='lead').
 * First gets the real count from Odoo, then fetches exactly that many records.
 */
export async function fetchCrmLeads(): Promise<CrmRow[]> {
  const count = await odooSearchCount("crm.lead", { domain: CRM_OPPORTUNITY_DOMAIN });
  if (count === 0) return [];
  return odooSearchRead<CrmRow>("crm.lead", {
    domain: CRM_OPPORTUNITY_DOMAIN,
    fields: [
      "id",
      "name",
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
    ],
    limit: count,
    order: "create_date desc",
  });
}
