import { NextResponse } from "next/server";
import { fetchProducts } from "@/lib/odoo-products";

export const dynamic = "force-dynamic";

/** List sellable products from Odoo (product library). */
export async function GET() {
  try {
    const products = await fetchProducts();
    return NextResponse.json(products);
  } catch (e) {
    console.error("Odoo products API error:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Odoo request failed" },
      { status: 500 }
    );
  }
}
