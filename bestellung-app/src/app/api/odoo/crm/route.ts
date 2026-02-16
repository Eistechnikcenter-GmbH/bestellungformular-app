import { NextResponse } from "next/server";
import { odooSearchRead } from "@/lib/odoo-client";

export const dynamic = "force-dynamic";

/** List CRM leads/opportunities from Odoo. */
export async function GET() {
  try {
    const rows = await odooSearchRead<{
      id: number;
      name?: string;
      partner_name?: string;
      email_from?: string;
      expected_revenue?: number;
      stage_id?: [number, string];
      user_id?: [number, string];
      create_date?: string;
    }>("crm.lead", {
      fields: [
        "id",
        "name",
        "partner_name",
        "email_from",
        "expected_revenue",
        "stage_id",
        "user_id",
        "create_date",
      ],
      limit: 500,
      order: "create_date desc",
    });
    return NextResponse.json(rows);
  } catch (e) {
    console.error("Odoo CRM API error:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Odoo request failed" },
      { status: 500 }
    );
  }
}
