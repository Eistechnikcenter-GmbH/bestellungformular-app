"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  downloadAdAuswertungExcel,
  downloadAdAuswertungPdf,
} from "@/lib/ad-auswertung/export-ad-auswertung";
import {
  getCurrentYearMonth,
  lastDayOfMonth,
  pad,
  RANGE_START_YEAR,
  todayIso,
} from "@/lib/ad-auswertung/date-utils";
import {
  buildChannelSummary,
  buildSourceSummary,
  invoicesForCalculation,
} from "@/lib/ad-auswertung/summaries";
import type { AdAuswertungResult } from "@/lib/ad-auswertung/types";
import { InvoiceTable } from "./InvoiceTable";
import { MonthNavigator } from "./MonthNavigator";
import { PinGate } from "./PinGate";
import { SummaryDashboard } from "./SummaryDashboard";

type DateMode = "month" | "range";

export function AdAuswertungClient() {
  const current = getCurrentYearMonth();
  const [dateMode, setDateMode] = useState<DateMode>("month");
  const [selectedYear, setSelectedYear] = useState(current.year);
  const [selectedMonth, setSelectedMonth] = useState(current.month);
  const [rangeFrom, setRangeFrom] = useState(`${RANGE_START_YEAR}-01-01`);
  const [rangeTo, setRangeTo] = useState(todayIso());
  const [minAmount, setMinAmount] = useState("2000");
  const [tagFilter, setTagFilter] = useState("all");
  const [channelFilter, setChannelFilter] = useState<"all" | "direct" | "agl">("all");
  const [includeEigenCompanies, setIncludeEigenCompanies] = useState(false);
  const [includeInKlaerung, setIncludeInKlaerung] = useState(false);

  const [unlocked, setUnlocked] = useState<boolean | null>(null);
  const [data, setData] = useState<AdAuswertungResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const { dateFrom, dateTo } = useMemo(() => {
    if (dateMode === "month") {
      return {
        dateFrom: `${selectedYear}-${pad(selectedMonth)}-01`,
        dateTo: lastDayOfMonth(selectedYear, selectedMonth),
      };
    }
    return { dateFrom: rangeFrom, dateTo: rangeTo };
  }, [dateMode, selectedYear, selectedMonth, rangeFrom, rangeTo]);

  const calculationInvoices = useMemo(() => {
    if (!data) return [];
    return invoicesForCalculation(data.invoices, {
      includeEigenCompanies,
      includeInKlaerung,
    });
  }, [data, includeEigenCompanies, includeInKlaerung]);

  const sourceSummary = useMemo(
    () => buildSourceSummary(calculationInvoices),
    [calculationInvoices]
  );

  const channelSummary = useMemo(
    () => buildChannelSummary(calculationInvoices),
    [calculationInvoices]
  );

  const exportData = useMemo((): AdAuswertungResult | null => {
    if (!data) return null;
    return {
      ...data,
      invoices: calculationInvoices,
      sourceSummary,
      channelSummary,
    };
  }, [data, calculationInvoices, sourceSummary, channelSummary]);

  const exportMeta = useMemo(
    () => ({
      dateFrom,
      dateTo,
      minAmount: Number(minAmount) || 0,
      tagFilter,
      channelFilter,
    }),
    [dateFrom, dateTo, minAmount, tagFilter, channelFilter]
  );

  const checkPin = useCallback(async () => {
    const res = await fetch("/api/ad-auswertung/verify", { credentials: "same-origin" });
    const json = (await res.json()) as { unlocked: boolean };
    setUnlocked(json.unlocked);
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({
        dateFrom,
        dateTo,
        minAmount: String(Number(minAmount) || 0),
        tag: tagFilter,
        channel: channelFilter,
      });
      const res = await fetch(`/api/ad-auswertung/data?${params}`, {
        credentials: "same-origin",
      });
      if (res.status === 401) {
        setUnlocked(false);
        setError("PIN erforderlich — bitte erneut freischalten.");
        return;
      }
      const json = (await res.json()) as AdAuswertungResult & { error?: string };
      if (!res.ok) {
        setError(json.error ?? "Fehler beim Laden");
        return;
      }
      setData(json);
    } catch {
      setError("Verbindungsfehler");
    } finally {
      setLoading(false);
    }
  }, [dateFrom, dateTo, minAmount, tagFilter, channelFilter]);

  useEffect(() => {
    checkPin();
  }, [checkPin]);

  useEffect(() => {
    if (unlocked) loadData();
  }, [unlocked, loadData]);

  function applyPresetYtd() {
    setDateMode("range");
    setRangeFrom(`${getCurrentYearMonth().year}-01-01`);
    setRangeTo(todayIso());
  }

  if (unlocked === null) {
    return <p className="text-center text-sm text-stone-500">Lade…</p>;
  }

  if (!unlocked) {
    return <PinGate onUnlocked={() => setUnlocked(true)} />;
  }

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-stone-200 bg-white p-4">
        <h2 className="mb-4 text-sm font-semibold text-stone-800">Filter</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-stone-600">
              Zeitraum
            </label>
            <div className="mb-2 flex gap-2">
              <button
                type="button"
                onClick={() => setDateMode("month")}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium ${
                  dateMode === "month"
                    ? "bg-stone-800 text-white"
                    : "border border-stone-300 text-stone-700"
                }`}
              >
                Einzelmonat
              </button>
              <button
                type="button"
                onClick={() => setDateMode("range")}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium ${
                  dateMode === "range"
                    ? "bg-stone-800 text-white"
                    : "border border-stone-300 text-stone-700"
                }`}
              >
                Zeitraum
              </button>
            </div>
            {dateMode === "month" ? (
              <MonthNavigator
                year={selectedYear}
                month={selectedMonth}
                onChange={(y, m) => {
                  setSelectedYear(y);
                  setSelectedMonth(m);
                }}
              />
            ) : (
              <div className="flex gap-2">
                <input
                  type="date"
                  value={rangeFrom}
                  min={`${RANGE_START_YEAR}-01-01`}
                  max={rangeTo}
                  onChange={(e) => setRangeFrom(e.target.value)}
                  className="w-full rounded-lg border border-stone-300 px-2 py-2 text-sm"
                />
                <input
                  type="date"
                  value={rangeTo}
                  min={rangeFrom}
                  max={todayIso()}
                  onChange={(e) => setRangeTo(e.target.value)}
                  className="w-full rounded-lg border border-stone-300 px-2 py-2 text-sm"
                />
              </div>
            )}
            <button
              type="button"
              onClick={applyPresetYtd}
              className="mt-2 text-xs text-stone-600 underline hover:text-stone-800"
            >
              Januar bis heute
            </button>
          </div>

          <div>
            <label htmlFor="min-amount" className="mb-1 block text-xs font-medium text-stone-600">
              Mindestbetrag (brutto)
            </label>
            <input
              id="min-amount"
              type="number"
              min={0}
              step={100}
              value={minAmount}
              onChange={(e) => setMinAmount(e.target.value)}
              className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label htmlFor="tag-filter" className="mb-1 block text-xs font-medium text-stone-600">
              Quelle (CRM-Tag)
            </label>
            <select
              id="tag-filter"
              value={tagFilter}
              onChange={(e) => setTagFilter(e.target.value)}
              className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
            >
              <option value="all">Alle Quellen</option>
              {(data?.availableTags ?? []).map((tag) => (
                <option key={tag} value={tag}>
                  {tag}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="channel-filter" className="mb-1 block text-xs font-medium text-stone-600">
              Zahlungsweg
            </label>
            <select
              id="channel-filter"
              value={channelFilter}
              onChange={(e) =>
                setChannelFilter(e.target.value as "all" | "direct" | "agl")
              }
              className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
            >
              <option value="all">Alle</option>
              <option value="direct">Direktzahlung</option>
              <option value="agl">AGL Leasing</option>
            </select>
          </div>

          <div className="space-y-2 sm:col-span-2 lg:col-span-3">
            <div className="flex items-center gap-2">
              <input
                id="include-eigen"
                type="checkbox"
                checked={includeEigenCompanies}
                onChange={(e) => setIncludeEigenCompanies(e.target.checked)}
                className="h-4 w-4 rounded border-stone-300"
              />
              <label htmlFor="include-eigen" className="text-sm text-stone-700">
                Eigene Unternehmen in Berechnung einbeziehen
                {data && data.eigenInvoiceCount > 0 && (
                  <span className="text-stone-500"> ({data.eigenInvoiceCount} mit Stichwort „Eigen“)</span>
                )}
              </label>
            </div>
            <div className="flex items-center gap-2">
              <input
                id="include-klaerung"
                type="checkbox"
                checked={includeInKlaerung}
                onChange={(e) => setIncludeInKlaerung(e.target.checked)}
                className="h-4 w-4 rounded border-stone-300"
              />
              <label htmlFor="include-klaerung" className="text-sm text-stone-700">
                In Klärung in Berechnung einbeziehen
                {data && data.klaerungInvoiceCount > 0 && (
                  <span className="text-stone-500">
                    {" "}
                    ({data.klaerungInvoiceCount} mit Stichwort „in Klärung“)
                  </span>
                )}
              </label>
            </div>
          </div>

          <div className="flex flex-wrap items-end gap-2">
            <button
              type="button"
              onClick={loadData}
              disabled={loading}
              className="rounded-lg bg-stone-800 px-4 py-2 text-sm font-medium text-white hover:bg-stone-700 disabled:opacity-50"
            >
              {loading ? "Lädt…" : "Aktualisieren"}
            </button>
            {exportData && exportData.invoices.length > 0 && (
              <>
                <button
                  type="button"
                  onClick={() => downloadAdAuswertungPdf(exportData, exportMeta)}
                  className="rounded-lg border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50"
                >
                  PDF exportieren
                </button>
                <button
                  type="button"
                  onClick={() => downloadAdAuswertungExcel(exportData, exportMeta)}
                  className="rounded-lg border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50"
                >
                  Excel exportieren
                </button>
              </>
            )}
          </div>
        </div>
        <p className="mt-3 text-xs text-stone-500">
          Zeitraum: {new Date(dateFrom).toLocaleDateString("de-DE")} –{" "}
          {new Date(dateTo).toLocaleDateString("de-DE")}
        </p>
      </section>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          {error}
        </div>
      )}

      {data && data.unmatchedLeasingCustomers.length > 0 && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <strong>
            {data.unmatchedLeasingCustomers.length}{" "}
            {data.unmatchedLeasingCustomers.length === 1 ? "Kunde konnte" : "Kunden konnten"}{" "}
            nicht zugeordnet werden
          </strong>
          , bitte in Odoo prüfen (
          {data.unmatchedLeasingCustomers.join(", ")}).
        </div>
      )}

      {data && !loading && (
        <>
          {data.eigenInvoiceCount > 0 && !includeEigenCompanies && (
            <div className="rounded-lg border border-red-200 bg-red-50/60 px-4 py-3 text-sm text-red-900">
              {data.eigenInvoiceCount}{" "}
              {data.eigenInvoiceCount === 1 ? "Rechnung eines eigenen Unternehmens ist" : "Rechnungen eigener Unternehmen sind"}{" "}
              in der Liste sichtbar (roter Rahmen), aber nicht in den Kennzahlen enthalten.
            </div>
          )}

          {data.klaerungInvoiceCount > 0 && !includeInKlaerung && (
            <div className="rounded-lg border border-amber-200 bg-amber-50/60 px-4 py-3 text-sm text-amber-900">
              {data.klaerungInvoiceCount}{" "}
              {data.klaerungInvoiceCount === 1 ? "Rechnung in Klärung ist" : "Rechnungen in Klärung sind"}{" "}
              in der Liste sichtbar (gelber Rahmen), aber nicht in den Kennzahlen enthalten.
            </div>
          )}

          <SummaryDashboard
            sourceSummary={sourceSummary}
            channelSummary={channelSummary}
            invoiceCount={calculationInvoices.length}
            uniqueCustomerCount={
              new Set(
                calculationInvoices.map((i) => i.endCustomerPartnerId ?? i.endCustomerName)
              ).size
            }
          />

          <section>
            <h2 className="mb-3 text-sm font-semibold text-stone-800">
              Rechnungen ({data.invoices.length}
              {(data.eigenInvoiceCount > 0 || data.klaerungInvoiceCount > 0) && (
                <span className="font-normal text-stone-500">
                  {data.eigenInvoiceCount > 0 && ` · ${data.eigenInvoiceCount} Eigen`}
                  {data.klaerungInvoiceCount > 0 && ` · ${data.klaerungInvoiceCount} in Klärung`}
                </span>
              )}
              )
            </h2>
            <InvoiceTable invoices={data.invoices} />
          </section>
        </>
      )}

      {loading && !data && (
        <p className="text-center text-sm text-stone-500">Daten werden geladen…</p>
      )}
    </div>
  );
}
