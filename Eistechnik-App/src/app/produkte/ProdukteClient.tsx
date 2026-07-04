"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CUSTOM_PRODUCTS_STORAGE_KEY,
  FIXED_PRODUCTS,
  parseCustomProducts,
  type SelectableProduct,
} from "@/lib/bestellformular-products";

export function ProdukteClient() {
  const [search, setSearch] = useState("");
  const [customProducts, setCustomProducts] = useState<SelectableProduct[]>([]);
  const [newName, setNewName] = useState("");
  const [newPrice, setNewPrice] = useState("");

  // Load custom products from localStorage
  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem(CUSTOM_PRODUCTS_STORAGE_KEY);
    setCustomProducts(parseCustomProducts(stored));
  }, []);

  // Persist on change
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(
        CUSTOM_PRODUCTS_STORAGE_KEY,
        JSON.stringify(customProducts)
      );
    } catch {
      // ignore
    }
  }, [customProducts]);

  const all = useMemo(
    () => [...FIXED_PRODUCTS, ...customProducts],
    [customProducts]
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return all;
    return all.filter((p) => p.name.toLowerCase().includes(q));
  }, [all, search]);

  const formatPriceGerman = (value: number): string => {
    const [intPart, decPart] = value.toFixed(2).split(".");
    const withDots = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    return `${withDots},${decPart}€`;
  };

  const handleAdd = () => {
    const name = newName.trim();
    if (!name) return;
    const priceStr = newPrice.trim().replace(",", ".");
    const price = priceStr ? parseFloat(priceStr) : undefined;
    const product: SelectableProduct = {
      id: `custom-${Date.now()}`,
      name,
      price: Number.isFinite(price) ? price : undefined,
    };
    setCustomProducts((prev) => [...prev, product]);
    setNewName("");
    setNewPrice("");
  };

  const handleRemove = (id: string) => {
    setCustomProducts((prev) => prev.filter((p) => p.id !== id));
  };

  return (
    <div className="rounded-xl border border-stone-300 bg-white shadow-sm">
      <div className="border-b border-stone-200 p-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <label className="mb-1 block text-xs font-medium text-stone-600">
            Suchen
          </label>
          <input
            type="search"
            placeholder="Suchen (Name)…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full max-w-sm rounded border border-stone-300 px-3 py-2 text-sm focus:border-stone-500 focus:outline-none"
          />
        </div>
        <div className="flex-1 max-w-md space-y-1">
          <p className="text-xs font-medium text-stone-600">
            Neues Produkt für das Bestellformular hinzufügen
          </p>
          <div className="flex flex-wrap gap-2">
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Name"
              className="min-w-[160px] flex-1 rounded border border-stone-300 px-2 py-1.5 text-sm focus:border-stone-500 focus:outline-none"
            />
            <input
              type="text"
              value={newPrice}
              onChange={(e) => setNewPrice(e.target.value)}
              placeholder="Preis (optional)"
              className="w-32 rounded border border-stone-300 px-2 py-1.5 text-right text-sm focus:border-stone-500 focus:outline-none"
            />
            <button
              type="button"
              onClick={handleAdd}
              disabled={!newName.trim()}
              className="rounded border border-stone-300 bg-stone-800 px-3 py-1.5 text-sm font-medium text-white hover:bg-stone-700 disabled:opacity-50 focus:outline-none"
            >
              Hinzufügen
            </button>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-stone-300 bg-stone-50">
              <th className="p-3 text-left font-medium text-stone-600">Name</th>
              <th className="p-3 text-right font-medium text-stone-600">
                Netto-Preis (EUR)
              </th>
              <th className="w-10 p-3" />
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={3} className="p-6 text-center text-stone-500">
                  Keine Produkte.
                </td>
              </tr>
            ) : (
              filtered.map((p) => {
                const isFixed = p.id.startsWith("fix-");
                return (
                  <tr
                    key={p.id}
                    className="border-b border-stone-100 hover:bg-stone-50"
                  >
                    <td className="p-3 text-stone-800">{p.name}</td>
                    <td className="p-3 text-right tabular-nums text-stone-700">
                      {p.price != null ? formatPriceGerman(p.price) : "—"}
                    </td>
                    <td className="p-3 text-right">
                      {!isFixed && (
                        <button
                          type="button"
                          onClick={() => handleRemove(p.id)}
                          className="text-xs text-red-500 hover:text-red-700"
                        >
                          Löschen
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
      <div className="border-t border-stone-200 px-4 py-2 text-xs text-stone-500">
        {filtered.length} von {all.length} Produkten
      </div>
    </div>
  );
}
