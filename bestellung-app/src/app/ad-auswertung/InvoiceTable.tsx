"use client";

import type { ProcessedInvoice } from "@/lib/ad-auswertung/types";

function formatEur(value: number): string {
  return value.toLocaleString("de-DE", { style: "currency", currency: "EUR" });
}

function formatDate(iso: string): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("de-DE");
}

function TagSourceHint({ tagSource }: { tagSource: ProcessedInvoice["tagSource"] }) {
  if (tagSource === "auto_kalt_kontakt") {
    return (
      <span
        className="ml-1 inline-flex cursor-help text-amber-600"
        title="Automatische Zuordnung: weder CRM noch Kontakt-Stichwörter gefunden"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
          <path d="M12 2L1 21h22L12 2zm0 4.5L18.5 19h-13L12 6.5zM11 10v5h2v-5h-2zm0 6v2h2v-2h-2z" />
        </svg>
      </span>
    );
  }
  if (tagSource === "contact") {
    return (
      <span
        className="ml-1 inline-flex cursor-help text-sky-600"
        title="Quelle aus Kontakt-Stichwörtern (category_id) — kein CRM-Eintrag"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
          <path d="M12 2a7 7 0 0 0-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 0 0-7-7zm0 9.5a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5z" />
        </svg>
      </span>
    );
  }
  return null;
}

export function InvoiceTable({ invoices }: { invoices: ProcessedInvoice[] }) {
  if (invoices.length === 0) {
    return (
      <p className="rounded-lg border border-stone-200 bg-white p-6 text-center text-sm text-stone-500">
        Keine Rechnungen für die gewählten Filter.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-stone-200 bg-white">
      <table className="w-full min-w-[900px] text-left text-sm">
        <thead>
          <tr className="border-b border-stone-200 bg-stone-50 text-xs font-medium uppercase tracking-wide text-stone-500">
            <th className="px-3 py-3">Rechnung</th>
            <th className="px-3 py-3">Datum</th>
            <th className="px-3 py-3">Status</th>
            <th className="px-3 py-3">Weg</th>
            <th className="px-3 py-3">Endkunde</th>
            <th className="px-3 py-3">Quelle (Tags)</th>
            <th className="px-3 py-3 text-right">Netto</th>
            <th className="px-3 py-3 text-right">MwSt.</th>
            <th className="px-3 py-3 text-right">Brutto</th>
          </tr>
        </thead>
        <tbody>
          {invoices.map((inv) => {
            const rowHighlight = inv.isEigenCompany
              ? "bg-red-50/40 ring-2 ring-inset ring-red-500"
              : inv.isInKlaerung
                ? "bg-amber-50/40 ring-2 ring-inset ring-amber-500"
                : "";
            const rowTitle = inv.isEigenCompany
              ? "Eigenes Unternehmen (Stichwort: Eigen)"
              : inv.isInKlaerung
                ? "In Klärung (Stichwort: in Klärung)"
                : undefined;

            return (
            <tr
              key={inv.id}
              className={`border-b border-stone-100 hover:bg-stone-50/50 ${rowHighlight}`}
              title={rowTitle}
            >
              <td className="px-3 py-2 font-medium text-stone-800">{inv.number}</td>
              <td className="px-3 py-2 text-stone-600">{formatDate(inv.invoiceDate)}</td>
              <td className="px-3 py-2 text-stone-600">{inv.statusLabel}</td>
              <td className="px-3 py-2">
                <span
                  className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                    inv.channel === "agl"
                      ? "bg-violet-100 text-violet-800"
                      : "bg-emerald-100 text-emerald-800"
                  }`}
                >
                  {inv.channel === "agl" ? "AGL" : "Direkt"}
                </span>
              </td>
              <td className="px-3 py-2">
                <span className={inv.unmatched ? "text-amber-700" : "text-stone-800"}>
                  {inv.endCustomerName}
                </span>
                {inv.leasingKunde && inv.channel === "agl" && (
                  <p className="text-xs text-stone-400" title="x_studio_leasing_kunde">
                    Leasing: {inv.leasingKunde}
                  </p>
                )}
              </td>
              <td className="px-3 py-2">
                {inv.tags.length === 0 ? (
                  <span className="text-stone-400">—</span>
                ) : (
                  <span className="flex flex-wrap items-center gap-1">
                    {inv.tags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-block rounded bg-stone-100 px-1.5 py-0.5 text-xs text-stone-700"
                      >
                        {tag}
                      </span>
                    ))}
                    <TagSourceHint tagSource={inv.tagSource} />
                  </span>
                )}
              </td>
              <td className="px-3 py-2 text-right text-stone-700">
                {formatEur(inv.amountUntaxed)}
              </td>
              <td className="px-3 py-2 text-right text-stone-500">
                {formatEur(inv.taxAmount)}
              </td>
              <td className="px-3 py-2 text-right font-medium text-stone-900">
                {formatEur(inv.amountTotal)}
              </td>
            </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
