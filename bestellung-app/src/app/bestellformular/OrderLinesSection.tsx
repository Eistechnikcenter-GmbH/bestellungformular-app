"use client";

import { useMemo, useState, useRef, useEffect } from "react";
import type { OdooProduct } from "@/lib/odoo-products";

function str(v: unknown): string {
  return typeof v === "string" ? v : "";
}

const DEFAULT_MWST = 19;

export type OrderLine = {
  stueck: number;
  productId: number | null;
  artikel: string;
  /** Netto as entered: number or note (free text). */
  netto: string;
  mwst: number;
  brutto: number;
};

const emptyLine: OrderLine = {
  stueck: 0,
  productId: null,
  artikel: "",
  netto: "",
  mwst: DEFAULT_MWST,
  brutto: 0,
};

/** Parse netto string (allows comma as decimal) to number; NaN if note/text. */
function parseNetto(s: string): number {
  const trimmed = String(s).trim().replace(",", ".");
  if (trimmed === "") return NaN;
  const n = parseFloat(trimmed);
  return Number.isFinite(n) ? n : NaN;
}

function ChevronDown() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0" aria-hidden>
      <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0" aria-hidden>
      <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

type Props = {
  products: OdooProduct[];
  lines: OrderLine[];
  onLinesChange: (lines: OrderLine[]) => void;
};

export function OrderLinesSection({ products, lines, onLinesChange }: Props) {
  const [openDropdownRow, setOpenDropdownRow] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  const filteredProducts = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return products.slice(0, 100);
    return products.filter(
      (p) =>
        str(p.name).toLowerCase().includes(q) ||
        str(p.default_code).toLowerCase().includes(q)
    ).slice(0, 100);
  }, [products, search]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpenDropdownRow(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const addLine = () => {
    onLinesChange([...lines, { ...emptyLine }]);
  };

  const updateLine = (rowIndex: number, upd: Partial<OrderLine>) => {
    const next = [...lines];
    next[rowIndex] = { ...next[rowIndex], ...upd };
    if (upd.netto !== undefined || upd.mwst != null) {
      const l = next[rowIndex];
      const nettoNum = parseNetto(l.netto ?? "");
      const mwst = l.mwst ?? DEFAULT_MWST;
      next[rowIndex] = {
        ...l,
        brutto: Number.isFinite(nettoNum)
          ? Math.round(nettoNum * (1 + mwst / 100) * 100) / 100
          : 0,
      };
    }
    onLinesChange(next);
  };

  const selectProduct = (rowIndex: number, p: OdooProduct) => {
    const netto =
      typeof p.list_price === "number"
        ? String(p.list_price)
        : "";
    updateLine(rowIndex, {
      productId: p.id,
      artikel: str(p.name) || str(p.default_code) || "",
      netto,
      mwst: DEFAULT_MWST,
    });
    setOpenDropdownRow(null);
    setSearch("");
  };

  return (
    <section className="mb-8 pt-6">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-sm font-bold text-stone-800">Bestellpositionen</h2>
        <button
          type="button"
          onClick={addLine}
          title="Zeile hinzufügen"
          className="flex items-center gap-1.5 rounded border border-stone-300 bg-white px-2.5 py-1.5 text-sm font-medium text-stone-700 shadow-sm hover:bg-stone-50 focus:outline-none"
        >
          <PlusIcon />
          Zeile hinzufügen
        </button>
      </div>
      <div className="overflow-x-auto pt-1" ref={containerRef}>
        <table className="w-full min-w-[600px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-stone-300 bg-stone-50">
              <th className="p-2 text-left font-medium text-stone-600">Stück</th>
              <th className="p-2 text-left font-medium text-stone-600">Artikel</th>
              <th className="p-2 text-right font-medium text-stone-600">Netto-Preis in EUR</th>
              <th className="p-2 text-right font-medium text-stone-600">MwSt.</th>
              <th className="p-2 text-right font-medium text-stone-600">Brutto-Preis in EUR</th>
            </tr>
          </thead>
          <tbody>
            {lines.length === 0 ? (
              <tr>
                <td colSpan={5} className="border-b border-stone-200 p-4 text-center text-stone-500">
                  Keine Positionen. Klicken Sie auf „Zeile hinzufügen“, um eine Position einzutragen.
                </td>
              </tr>
            ) : (
              lines.map((line, i) => (
              <tr key={i} className="border-b border-stone-200">
                <td className="p-2">
                  <input
                    type="number"
                    min={0}
                    value={line.stueck === 0 ? "" : line.stueck}
                    onChange={(e) => updateLine(i, { stueck: parseInt(e.target.value, 10) || 0 })}
                    className="w-16 rounded border border-stone-300 px-2 py-1 text-right focus:border-stone-500 focus:outline-none"
                  />
                </td>
                <td className="relative p-2">
                  <div className="flex w-full items-center gap-1">
                    <input
                      type="text"
                      value={line.artikel}
                      onChange={(e) => updateLine(i, { artikel: e.target.value })}
                      placeholder="Artikel eingeben oder aus Katalog wählen…"
                      className="min-w-0 flex-1 rounded border border-stone-300 px-2 py-1 text-stone-700 placeholder:text-stone-400 focus:border-stone-500 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setOpenDropdownRow(openDropdownRow === i ? null : i)}
                      title="Aus Produktbibliothek wählen"
                      className="shrink-0 rounded border border-stone-300 bg-stone-50 p-1.5 text-stone-600 hover:bg-stone-100 focus:outline-none"
                    >
                      <ChevronDown />
                    </button>
                  </div>
                  {openDropdownRow === i && (
                    <div className="absolute left-0 right-0 top-full z-[100] mt-2 max-h-56 overflow-hidden rounded border border-stone-300 bg-white shadow-lg">
                      <div className="border-b border-stone-200 p-1">
                        <input
                          type="search"
                          placeholder="Suchen (Name, Artikelnummer)…"
                          value={search}
                          onChange={(e) => setSearch(e.target.value)}
                          className="w-full rounded border border-stone-200 px-2 py-1.5 text-sm focus:border-stone-400 focus:outline-none"
                          autoFocus
                        />
                      </div>
                      <ul className="max-h-44 overflow-y-auto py-1">
                        {filteredProducts.length === 0 ? (
                          <li className="px-2 py-1.5 text-stone-500">Keine Treffer.</li>
                        ) : (
                          filteredProducts.map((p) => (
                            <li key={p.id}>
                              <button
                                type="button"
                                className="w-full px-2 py-1.5 text-left text-sm hover:bg-stone-100 focus:bg-stone-100 focus:outline-none"
                                onClick={() => selectProduct(i, p)}
                              >
                                {str(p.name) || str(p.default_code) || `#${p.id}`}
                                {p.list_price != null && (
                                  <span className="ml-2 text-stone-500">
                                    {Number(p.list_price).toFixed(2)} EUR
                                  </span>
                                )}
                              </button>
                            </li>
                          ))
                        )}
                      </ul>
                    </div>
                  )}
                </td>
                <td className="p-2 text-right">
                  <input
                    type="text"
                    value={line.netto}
                    onChange={(e) => updateLine(i, { netto: e.target.value })}
                    placeholder="Zahl oder Notiz"
                    className="w-32 rounded border border-stone-300 px-2 py-1 text-right focus:border-stone-500 focus:outline-none"
                  />
                </td>
                <td className="p-2 text-right">
                  <input
                    type="number"
                    step={0.01}
                    min={0}
                    value={line.mwst ? String(line.mwst) : ""}
                    onChange={(e) => updateLine(i, { mwst: parseFloat(e.target.value) || 0 })}
                    className="w-16 rounded border border-stone-300 px-2 py-1 text-right focus:border-stone-500 focus:outline-none"
                  />
                  %
                </td>
                <td className="p-2 text-right font-medium tabular-nums">
                  {line.brutto > 0 ? line.brutto.toFixed(2) : "—"}
                </td>
              </tr>
            ))
            )}
          </tbody>
        </table>
      </div>
      <div className="mt-12 grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs text-stone-600">
            Unverbindlicher gewünschter Liefertermin
          </label>
          <input
            type="text"
            placeholder="z. B. schnellstmöglich"
            className="w-full border-0 border-b border-stone-300 bg-transparent px-0 py-1 text-sm focus:border-stone-500 focus:outline-none"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-stone-600">
            Ruhetage des Unternehmens
          </label>
          <input
            type="text"
            placeholder="z. B. keine"
            className="w-full border-0 border-b border-stone-300 bg-transparent px-0 py-1 text-sm focus:border-stone-500 focus:outline-none"
          />
        </div>
      </div>
    </section>
  );
}

export function getEmptyOrderLines(): OrderLine[] {
  return [];
}
