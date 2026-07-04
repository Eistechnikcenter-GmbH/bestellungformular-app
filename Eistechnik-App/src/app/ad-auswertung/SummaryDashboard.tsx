"use client";

import { buildPieSlices } from "@/lib/ad-auswertung/chart-utils";
import type { ChannelSummary, SourceSummary } from "@/lib/ad-auswertung/types";

function formatEur(value: number): string {
  return value.toLocaleString("de-DE", { style: "currency", currency: "EUR" });
}

function PieChart({ data }: { data: SourceSummary[] }) {
  const slices = buildPieSlices(data);

  if (slices.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center text-sm text-stone-500">
        Keine Umsätze im gewählten Zeitraum
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
      <svg viewBox="0 0 100 100" className="h-44 w-44 shrink-0">
        {slices.map((slice) => (
          <path key={slice.tag} d={slice.path} fill={slice.color}>
            <title>
              {slice.tag}: {formatEur(slice.revenueTotal)} ({slice.percent.toFixed(1)}%)
            </title>
          </path>
        ))}
      </svg>
      <ul className="flex-1 space-y-1 text-sm">
        {slices.map((slice) => (
          <li key={slice.tag} className="flex items-center gap-2">
            <span
              className="inline-block h-3 w-3 shrink-0 rounded-sm"
              style={{ backgroundColor: slice.color }}
            />
            <span className="font-medium text-stone-800">{slice.tag}</span>
            <span className="text-stone-500">
              {formatEur(slice.revenueTotal)} ({slice.percent.toFixed(1)}%)
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function SummaryCard({
  title,
  value,
  sub,
}: {
  title: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="rounded-lg border border-stone-200 bg-stone-50 p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-stone-500">{title}</p>
      <p className="mt-1 text-xl font-semibold text-stone-900">{value}</p>
      {sub && <p className="mt-1 text-xs text-stone-500">{sub}</p>}
    </div>
  );
}

export function SummaryDashboard({
  sourceSummary,
  channelSummary,
  invoiceCount,
  uniqueCustomerCount,
}: {
  sourceSummary: SourceSummary[];
  channelSummary: ChannelSummary[];
  invoiceCount: number;
  uniqueCustomerCount: number;
}) {
  const totalRevenue = sourceSummary.reduce((sum, s) => sum + s.revenueTotal, 0);
  const totalUntaxed = sourceSummary.reduce((sum, s) => sum + s.revenueUntaxed, 0);

  const direct = channelSummary.find((c) => c.channel === "direct");
  const agl = channelSummary.find((c) => c.channel === "agl");

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <SummaryCard title="Rechnungen" value={String(invoiceCount)} />
        <SummaryCard
          title="Umsatz brutto"
          value={formatEur(totalRevenue)}
          sub={`netto ${formatEur(totalUntaxed)}`}
        />
        <SummaryCard
          title="Quellen"
          value={String(sourceSummary.length)}
          sub="CRM-Tags mit Umsatz"
        />
        <SummaryCard title="Endkunden" value={String(uniqueCustomerCount)} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-stone-200 bg-white p-4">
          <h3 className="mb-3 text-sm font-semibold text-stone-800">
            Umsatz nach Quelle (CRM-Tags)
          </h3>
          <PieChart data={sourceSummary} />
        </div>

        <div className="rounded-xl border border-stone-200 bg-white p-4">
          <h3 className="mb-3 text-sm font-semibold text-stone-800">
            Zahlungsweg
          </h3>
          <div className="space-y-3">
            {[direct, agl].map(
              (ch) =>
                ch && (
                  <div
                    key={ch.channel}
                    className="flex items-center justify-between rounded-lg border border-stone-100 bg-stone-50 px-4 py-3"
                  >
                    <div>
                      <p className="font-medium text-stone-800">{ch.label}</p>
                      <p className="text-xs text-stone-500">
                        {ch.invoiceCount} Rechnungen · {ch.customerCount} Kunden
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-stone-900">
                        {formatEur(ch.revenueTotal)}
                      </p>
                      <p className="text-xs text-stone-500">
                        netto {formatEur(ch.revenueUntaxed)}
                      </p>
                    </div>
                  </div>
                )
            )}
          </div>

          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-stone-200 text-xs text-stone-500">
                  <th className="py-2 pr-2">Quelle</th>
                  <th className="py-2 pr-2 text-right">Rechn.</th>
                  <th className="py-2 pr-2 text-right">Kunden</th>
                  <th className="py-2 text-right">Brutto</th>
                </tr>
              </thead>
              <tbody>
                {sourceSummary.map((row) => (
                  <tr key={row.tag} className="border-b border-stone-100">
                    <td className="py-2 pr-2 font-medium">{row.tag}</td>
                    <td className="py-2 pr-2 text-right">{row.invoiceCount}</td>
                    <td className="py-2 pr-2 text-right">{row.customerCount}</td>
                    <td className="py-2 text-right">{formatEur(row.revenueTotal)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
