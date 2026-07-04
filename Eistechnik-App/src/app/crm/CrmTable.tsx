"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import type { CrmRow } from "@/lib/odoo-crm";

type SortKey = "name" | "partner_name" | "email_from" | "phone" | "stage" | "date";

const DATE_PRESETS = [
  { value: "", label: "Alle Daten" },
  { value: "today", label: "Heute" },
  { value: "week", label: "Diese Woche" },
  { value: "month", label: "Dieser Monat" },
  { value: "7d", label: "Letzte 7 Tage" },
  { value: "30d", label: "Letzte 30 Tage" },
] as const;

/** Odoo can return false or non-strings for empty fields; coerce to string for search/sort. */
function str(v: unknown): string {
  return typeof v === "string" ? v : "";
}

function getRowPhone(row: CrmRow): string {
  return str(row.phone) || "—";
}

function formatDate(s: string | undefined): string {
  if (!s) return "—";
  return new Date(s).toLocaleDateString("de-DE");
}

function parseDate(s: string | undefined): Date | null {
  if (!s) return null;
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
}

function matchesDatePreset(createDate: string | undefined, preset: string): boolean {
  const d = parseDate(createDate);
  if (!d || !preset) return true;
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const dayStart = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());
  switch (preset) {
    case "today":
      return dayStart(d).getTime() === today.getTime();
    case "week": {
      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() - today.getDay() + (today.getDay() === 0 ? -6 : 1));
      return d >= weekStart && d <= now;
    }
    case "month":
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    case "7d": {
      const from = new Date(now);
      from.setDate(from.getDate() - 7);
      return d >= from;
    }
    case "30d": {
      const from30 = new Date(now);
      from30.setDate(from30.getDate() - 30);
      return d >= from30;
    }
    default:
      return true;
  }
}

function RefreshIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="shrink-0"
      aria-hidden
    >
      <g
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
      >
        <path d="M21.888 13.5C21.164 18.311 17.013 22 12 22C6.477 22 2 17.523 2 12S6.477 2 12 2c4.1 0 7.625 2.468 9.168 6" />
        <path d="M17 8h4.4a.6.6 0 0 0 .6-.6V3" />
      </g>
    </svg>
  );
}

export function CrmTable({ rows: initialRows }: { rows: CrmRow[] }) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [phaseFilter, setPhaseFilter] = useState<string>("");
  const [dateFilter, setDateFilter] = useState<string>("");
  const [sortKey, setSortKey] = useState<SortKey>("date");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const phases = useMemo(() => {
    const set = new Set<string>();
    initialRows.forEach((r) => {
      const s = Array.isArray(r.stage_id) ? r.stage_id[1] : "";
      if (s) set.add(s);
    });
    return Array.from(set).sort();
  }, [initialRows]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = initialRows.filter((row) => {
      if (q) {
        const name = str(row.name).toLowerCase();
        const email = str(row.email_from).toLowerCase();
        const phone = getRowPhone(row).toLowerCase();
        const kunde = str(row.partner_name).toLowerCase();
        const match = name.includes(q) || email.includes(q) || phone.includes(q) || kunde.includes(q);
        if (!match) return false;
      }
      if (phaseFilter) {
        const stage = Array.isArray(row.stage_id) ? row.stage_id[1] : "";
        if (stage !== phaseFilter) return false;
      }
      if (dateFilter && !matchesDatePreset(row.create_date, dateFilter)) return false;
      return true;
    });

    list = [...list].sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case "name":
          cmp = str(a.name).localeCompare(str(b.name));
          break;
        case "partner_name":
          cmp = str(a.partner_name).localeCompare(str(b.partner_name));
          break;
        case "email_from":
          cmp = str(a.email_from).localeCompare(str(b.email_from));
          break;
        case "phone":
          cmp = getRowPhone(a).localeCompare(getRowPhone(b));
          break;
        case "stage":
          cmp = str(Array.isArray(a.stage_id) ? a.stage_id[1] : "").localeCompare(
            str(Array.isArray(b.stage_id) ? b.stage_id[1] : "")
          );
          break;
        case "date":
          cmp = str(a.create_date).localeCompare(str(b.create_date));
          break;
        default:
          break;
      }
      return sortDir === "asc" ? cmp : -cmp;
    });
    return list;
  }, [initialRows, search, phaseFilter, dateFilter, sortKey, sortDir]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortDir(key === "date" ? "desc" : "asc");
    }
  };

  const SortIcon = () => {
    if (sortDir === "asc") {
      return (
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0" aria-hidden>
          <path d="M6 3v6M3 6l3-3 3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    }
    return (
      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0" aria-hidden>
        <path d="M6 9V3M3 6l3 3 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  };

  const Th = ({
    label,
    sortKey: sk,
  }: {
    label: string;
    sortKey: SortKey;
  }) => (
    <th className="p-3 font-medium text-stone-600">
      <button
        type="button"
        onClick={() => handleSort(sk)}
        className="flex w-full items-center gap-1.5 text-left hover:text-stone-900"
      >
        {label}
        {sortKey === sk && <SortIcon />}
      </button>
    </th>
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 sm:w-80">
          <input
            type="search"
            placeholder="Suchen (Name, E-Mail, Telefon, Kunde)…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="min-w-0 flex-1 rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm focus:border-stone-500 focus:outline-none focus:ring-1 focus:ring-stone-500"
            aria-label="Leads durchsuchen"
          />
          <button
            type="button"
            onClick={() => router.refresh()}
            className="shrink-0 rounded-lg border border-stone-300 bg-white p-2 text-stone-600 hover:bg-stone-50 hover:text-stone-900 focus:outline-none focus:ring-1 focus:ring-stone-500"
            title="Aktualisieren"
            aria-label="Liste aus Odoo aktualisieren"
          >
            <RefreshIcon />
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          <select
            value={phaseFilter}
            onChange={(e) => setPhaseFilter(e.target.value)}
            className="rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm focus:border-stone-500 focus:outline-none"
            aria-label="Phase filtern"
          >
            <option value="">Alle Phasen</option>
            {phases.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm focus:border-stone-500 focus:outline-none"
            aria-label="Datum filtern"
          >
            {DATE_PRESETS.map(({ value, label }) => (
              <option key={value || "all"} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
      </div>
      <p className="text-sm text-stone-600">
        <strong>{filtered.length}</strong> Ergebnisse gefunden
      </p>
      <div className="overflow-x-auto rounded-xl border border-stone-300 bg-white shadow-sm">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead>
            <tr className="border-b border-stone-200 bg-stone-50">
              <Th label="Name" sortKey="name" />
              <Th label="Kunde" sortKey="partner_name" />
              <Th label="E-Mail" sortKey="email_from" />
              <Th label="Telefon" sortKey="phone" />
              <Th label="Phase" sortKey="stage" />
              <Th label="Datum" sortKey="date" />
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-6 text-center text-stone-500">
                  Keine Einträge.
                </td>
              </tr>
            ) : (
              filtered.map((row) => (
                <tr
                  key={row.id}
                  className="border-b border-stone-100 hover:bg-stone-50"
                >
                  <td className="p-3">{str(row.name) || "—"}</td>
                  <td className="p-3">{str(row.partner_name) || "—"}</td>
                  <td className="p-3">{str(row.email_from) || "—"}</td>
                  <td className="p-3">{getRowPhone(row)}</td>
                  <td className="p-3">
                    {str(Array.isArray(row.stage_id) ? row.stage_id[1] : "") || "—"}
                  </td>
                  <td className="p-3">{formatDate(row.create_date)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
