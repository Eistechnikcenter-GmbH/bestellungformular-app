import { NextResponse } from "next/server";
import { fetchCrmLeads, type CrmRow } from "@/lib/odoo-crm";

export const dynamic = "force-dynamic";

type LeadAddressRow = {
  id: number;
  label: string;
  address: string;
};

function compactAddress(lead: CrmRow): string {
  const street = lead.partner?.street ?? lead.street ?? "";
  const street2 = lead.partner?.street2 ?? lead.street2 ?? "";
  const zip = lead.partner?.zip ?? lead.zip ?? "";
  const city = lead.partner?.city ?? lead.city ?? "";

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

export async function GET() {
  try {
    const leads = await fetchCrmLeads();
    const rows: LeadAddressRow[] = leads
      .map((lead) => {
        const address = compactAddress(lead);
        const label = lead.partner?.name ?? lead.partner_name ?? lead.contact_name ?? lead.name ?? `Lead #${lead.id}`;
        return {
          id: lead.id,
          label,
          address,
        };
      })
      .filter((row) => row.address.trim().length > 0);

    return NextResponse.json(rows);
  } catch (e) {
    console.error("Anfahrtskosten leads API error:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "CRM request failed" },
      { status: 500 }
    );
  }
}
