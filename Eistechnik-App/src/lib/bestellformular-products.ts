/**
 * Fixed product list for the order form (Bestellpositionen).
 * Not from Odoo – chosen selection only. Custom products can be added via the form.
 */
export type SelectableProduct = {
  id: string;
  name: string;
  /** Netto price in EUR; undefined = no price (user enters manually). */
  price?: number;
};

export const FIXED_PRODUCTS: SelectableProduct[] = [
  { id: "fix-1", name: "Softeis SB Automat Carpigiani Magica Colore komplett" },
  { id: "fix-2", name: "Softeis SB Automat Carpigiani Magica Colore" },
  { id: "fix-3", name: "Softeismaschine Carpigiani 243 TPSP, 230V, Luftgek." },
  { id: "fix-4", name: "Softeismaschine Carpigiani 243 TGSP, 230 V, Luftgek." },
  { id: "fix-5", name: "Softeismaschine Telme Tischgerät 3 Zapfhebel / Sonderpreis" },
  { id: "fix-6", name: "Untertisch mit Rädern", price: 590 },
  { id: "fix-7", name: "Werbestatur „Softeis“ ca. 2,00m -50% Rabatt", price: 795 },
];

/** LocalStorage key for user-defined additional products. */
export const CUSTOM_PRODUCTS_STORAGE_KEY = "etc-bestellformular-custom-products-v1";

export function parseCustomProducts(json: string | null): SelectableProduct[] {
  if (!json) return [];
  try {
    const data = JSON.parse(json);
    if (!Array.isArray(data)) return [];
    return data
      .filter((p) => p && typeof p.id === "string" && typeof p.name === "string")
      .map((p) => ({
        id: String(p.id),
        name: String(p.name),
        price: typeof p.price === "number" ? p.price : undefined,
      }));
  } catch {
    return [];
  }
}
