"use client";

import { useState, useEffect, useCallback } from "react";
import { BuyerSection, emptyBuyer, type BuyerData } from "./BuyerSection";
import {
  OrderLinesSection,
  getEmptyOrderLines,
  type OrderLine,
} from "./OrderLinesSection";
import {
  OptionsSection,
  defaultOptions,
  type OptionsData,
} from "./OptionsSection";
import { SignatureDateSection } from "./SignatureDateSection";
import type { CrmRow } from "@/lib/odoo-crm";
import type { OdooProduct } from "@/lib/odoo-products";
import {
  downloadBestellungPdf,
  buildBestellungPdf,
  loadHeaderFooterImages,
  type BestellungPdfData,
} from "@/lib/pdf-export/bestellung-pdf";

/** Verkäufer options for dropdown (value = filename in public/signing without .png). */
export const VERKAUFER_OPTIONS = [
  { value: "wilhelm-breuer", label: "Wilhelm Breuer" },
  { value: "isabell-richter", label: "Isabell Richter" },
  { value: "michael-gellert", label: "Michael Gellert" },
] as const;

/** Load signature image and return data URL + pixel size so PDF can preserve aspect ratio. */
async function loadSignatureImage(
  key: string
): Promise<{ dataUrl: string; width: number; height: number } | undefined> {
  if (typeof window === "undefined" || !key) return undefined;
  try {
    const res = await fetch(`${window.location.origin}/signing/${key}.png`);
    if (!res.ok) return undefined;
    const blob = await res.blob();
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(r.result as string);
      r.onerror = reject;
      r.readAsDataURL(blob);
    });
    const url = URL.createObjectURL(blob);
    const { width, height } = await new Promise<{ width: number; height: number }>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
      img.onerror = reject;
      img.src = url;
    });
    URL.revokeObjectURL(url);
    return { dataUrl, width, height };
  } catch {
    return undefined;
  }
}

type Props = { leads: CrmRow[] };

function formatDatumDDMMYYYY(iso: string): string {
  if (!iso || iso.length < 10) return "";
  const [y, m, d] = iso.split("-");
  return `${d}.${m}.${y}`;
}

function getTodayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

export function OrderForm({ leads }: Props) {
  const [verkaufer, setVerkaufer] = useState<string>("");
  const [buyer, setBuyer] = useState<BuyerData>(emptyBuyer);
  const [products, setProducts] = useState<OdooProduct[]>([]);
  const [lines, setLines] = useState<OrderLine[]>(getEmptyOrderLines());
  const [options, setOptions] = useState<OptionsData>(defaultOptions);
  const [liefertermin, setLiefertermin] = useState("");
  const [ruhetage, setRuhetage] = useState("");
  const [datum, setDatum] = useState<string>(() => getTodayISO());
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  const getPdfData = useCallback((): BestellungPdfData => ({
    ...buyer,
    liefertermin: liefertermin || undefined,
    ruhetage: ruhetage || undefined,
    datum: formatDatumDDMMYYYY(datum) || undefined,
    option1: options.option1,
    option2: options.option2,
    option3: options.option3,
    lines: lines.map((l) => ({
      stueck: l.stueck,
      artikel: l.artikel,
      netto: l.netto,
      mwst: l.mwst,
      brutto: l.brutto,
    })),
  }), [buyer, liefertermin, ruhetage, datum, options, lines]);

  const refreshPreview = useCallback(async () => {
    setPreviewLoading(true);
    try {
      const [images, sig] = await Promise.all([
        loadHeaderFooterImages(),
        verkaufer ? loadSignatureImage(verkaufer) : Promise.resolve(undefined),
      ]);
      const data: BestellungPdfData = {
        ...getPdfData(),
        verkauferSignatureDataUrl: sig?.dataUrl,
        verkauferSignatureWidth: sig?.width,
        verkauferSignatureHeight: sig?.height,
      };
      const blob = await buildBestellungPdf(data, images);
      const url = URL.createObjectURL(blob);
      setPreviewUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return url;
      });
    } catch {
      setPreviewUrl(null);
    } finally {
      setPreviewLoading(false);
    }
  }, [getPdfData, verkaufer]);

  const closePreview = useCallback(() => {
    setPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
  }, []);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  useEffect(() => {
    fetch("/api/products")
      .then((r) => (r.ok ? r.json() : []))
      .then(setProducts)
      .catch(() => setProducts([]));
  }, []);

  return (
    <div className="rounded-xl border border-stone-300 bg-white p-6 shadow-sm">
      <p className="mb-6 text-sm text-stone-600">
        Es wird hiermit nach Kenntnisnahme und Zugrundelegung der Geschäfts- und
        Lieferbedingungen des Verkäufers verbindlich bestellt:
      </p>

      <section className="mb-8">
        <h2 className="mb-2 text-sm font-bold text-stone-800">Verkäufer</h2>
        <div className="mb-3">
          <label htmlFor="verkaufer" className="mb-1 block text-xs font-medium text-stone-600">
            In Vertretung (Unterschrift im PDF)
          </label>
          <select
            id="verkaufer"
            value={verkaufer}
            onChange={(e) => setVerkaufer(e.target.value)}
            className="w-full max-w-xs rounded border border-stone-300 bg-white px-3 py-2 text-sm text-stone-800 focus:outline-none focus:ring-2 focus:ring-stone-400"
          >
            <option value="">— Bitte wählen —</option>
            {VERKAUFER_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
        <div className="text-sm text-stone-700">
          <p>Eistechnikcenter GmbH</p>
          <p>14943 Luckenwalde</p>
          <p>Tel.: (03371) 68 97 940</p>
          <p>E-Mail: info@eistechnikcenter.de</p>
        </div>
      </section>

      <BuyerSection leads={leads} buyer={buyer} onBuyerChange={setBuyer} />

      <OrderLinesSection
        products={products}
        lines={lines}
        onLinesChange={setLines}
        liefertermin={liefertermin}
        ruhetage={ruhetage}
        onLieferterminChange={setLiefertermin}
        onRuhetageChange={setRuhetage}
      />

      <OptionsSection options={options} onOptionsChange={setOptions} />

      <SignatureDateSection value={datum} onChange={setDatum} />

      <div className="mt-8 flex flex-wrap items-center justify-end gap-2 border-t border-stone-200 pt-6">
        <button
          type="button"
          onClick={() => void refreshPreview()}
          disabled={previewLoading}
          className="rounded-lg border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50 focus:outline-none disabled:opacity-50"
        >
          {previewUrl ? (previewLoading ? "Aktualisiere…" : "PDF-Vorschau aktualisieren") : (previewLoading ? "Lade Vorschau…" : "PDF-Vorschau")}
        </button>
        <button
          type="button"
          onClick={async () => {
            const sig = verkaufer ? await loadSignatureImage(verkaufer) : undefined;
            const data: BestellungPdfData = {
              ...getPdfData(),
              verkauferSignatureDataUrl: sig?.dataUrl,
              verkauferSignatureWidth: sig?.width,
              verkauferSignatureHeight: sig?.height,
            };
            await downloadBestellungPdf(data);
          }}
          className="rounded-lg border border-stone-300 bg-stone-800 px-4 py-2 text-sm font-medium text-white hover:bg-stone-700 focus:outline-none"
        >
          Als PDF exportieren
        </button>
      </div>

      {previewUrl && (
        <div className="mt-6 rounded-xl border border-stone-300 bg-stone-50 p-4">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm font-medium text-stone-700">Live-Vorschau</span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => void refreshPreview()}
                disabled={previewLoading}
                className="rounded border border-stone-300 bg-white px-2 py-1 text-xs font-medium text-stone-600 hover:bg-stone-100 disabled:opacity-50"
              >
                Aktualisieren
              </button>
              <button
                type="button"
                onClick={closePreview}
                className="rounded border border-stone-300 bg-white px-2 py-1 text-xs font-medium text-stone-600 hover:bg-stone-100"
              >
                Schließen
              </button>
            </div>
          </div>
          <iframe
            src={previewUrl}
            title="PDF-Vorschau"
            className="h-[min(80vh,800px)] w-full rounded-lg border border-stone-200 bg-white"
          />
        </div>
      )}
    </div>
  );
}
