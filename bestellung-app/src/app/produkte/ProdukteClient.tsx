"use client";

import { useEffect, useState, useMemo } from "react";
import type { OdooProduct } from "@/lib/odoo-products";

function str(v: unknown): string {
  return typeof v === "string" ? v : "";
}

export function ProdukteClient() {
  const [products, setProducts] = useState<OdooProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetch("/api/products")
      .then((r) => {
        if (!r.ok) throw new Error("Produkte konnten nicht geladen werden.");
        return r.json();
      })
      .then(setProducts)
      .catch((e) => setError(e instanceof Error ? e.message : "Fehler"))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return products;
    return products.filter(
      (p) =>
        str(p.name).toLowerCase().includes(q) ||
        str(p.default_code).toLowerCase().includes(q)
    );
  }, [products, search]);

  if (loading) {
    return (
      <div className="rounded-xl border border-stone-300 bg-white p-8 text-center text-stone-500">
        Produkte werden geladen…
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
        {error}
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-stone-300 bg-white shadow-sm">
      <div className="border-b border-stone-200 p-4">
        <input
          type="search"
          placeholder="Suchen (Name, Artikelnummer)…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-sm rounded border border-stone-300 px-3 py-2 text-sm focus:border-stone-500 focus:outline-none"
        />
      </div>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-stone-300 bg-stone-50">
              <th className="p-3 text-left font-medium text-stone-600">
                Artikelnummer
              </th>
              <th className="p-3 text-left font-medium text-stone-600">Name</th>
              <th className="p-3 text-right font-medium text-stone-600">
                Listenpreis (EUR)
              </th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={3} className="p-6 text-center text-stone-500">
                  {products.length === 0
                    ? "Keine verkaufbaren Produkte in Odoo."
                    : "Keine Treffer für die Suche."}
                </td>
              </tr>
            ) : (
              filtered.map((p) => (
                <tr
                  key={p.id}
                  className="border-b border-stone-100 hover:bg-stone-50"
                >
                  <td className="p-3 text-stone-600">
                    {str(p.default_code) || "—"}
                  </td>
                  <td className="p-3 text-stone-800">
                    {str(p.name) || `#${p.id}`}
                  </td>
                  <td className="p-3 text-right tabular-nums text-stone-700">
                    {typeof p.list_price === "number"
                      ? p.list_price.toFixed(2)
                      : "—"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <div className="border-t border-stone-200 px-4 py-2 text-xs text-stone-500">
        {filtered.length} von {products.length} Produkten
      </div>
    </div>
  );
}
