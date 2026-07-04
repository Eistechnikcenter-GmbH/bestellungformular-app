import { odooSearchCount, odooSearchRead } from "./odoo-client";

export type OdooProduct = {
  id: number;
  name?: string;
  list_price?: number;
  default_code?: string;
  taxes_id?: [number, string][] | number[];
};

/** Fetch sellable products from Odoo (product.product with sale_ok). */
export async function fetchProducts(): Promise<OdooProduct[]> {
  const count = await odooSearchCount("product.product", {
    domain: [["sale_ok", "=", true]],
  });
  if (count === 0) return [];
  return odooSearchRead<OdooProduct>("product.product", {
    domain: [["sale_ok", "=", true]],
    fields: ["id", "name", "list_price", "default_code", "taxes_id"],
    limit: count,
    order: "name asc",
  });
}
