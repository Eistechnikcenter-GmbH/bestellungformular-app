import { NextResponse } from "next/server";
import { compactCrmAddress, crmLeadLabel } from "@/lib/crm-address";
import { fetchCrmLeads } from "@/lib/odoo-crm";

export const dynamic = "force-dynamic";

type LeadAddressRow = {
  id: number;
  label: string;
  address: string;
};

export async function GET() {
  try {
    const leads = await fetchCrmLeads();
    const rows: LeadAddressRow[] = leads
      .map((lead) => {
        const address = compactCrmAddress(lead);
        const label = crmLeadLabel(lead);
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
