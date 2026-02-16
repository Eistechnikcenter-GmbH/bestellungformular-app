"use client";

import { useMemo, useState, useRef, useEffect } from "react";
import type { CrmRow } from "@/lib/odoo-crm";

function str(v: unknown): string {
  return typeof v === "string" ? v : "";
}

function getRowPhone(row: CrmRow): string {
  return str(row.phone) || "";
}

export type BuyerData = {
  firma: string;
  seit: string;
  branche: string;
  name: string;
  vorname: string;
  gebDatum: string;
  plzOrt: string;
  strasseHausnummer: string;
  adresszusatz: string;
  telefon: string;
  mobil: string;
  fax: string;
  email: string;
  lieferPlzOrt: string;
  lieferStrasse: string;
  lieferTelefon: string;
};

const emptyBuyer: BuyerData = {
  firma: "",
  seit: "",
  branche: "",
  name: "",
  vorname: "",
  gebDatum: "",
  plzOrt: "",
  strasseHausnummer: "",
  adresszusatz: "",
  telefon: "",
  mobil: "",
  fax: "",
  email: "",
  lieferPlzOrt: "",
  lieferStrasse: "",
  lieferTelefon: "",
};

function leadToBuyer(row: CrmRow): BuyerData {
  const city = str(row.city);
  const zip = str(row.zip);
  const plzOrt = [zip, city].filter(Boolean).join(" ");
  const contact = str(row.contact_name).trim();
  const parts = contact.split(/\s+/);
  const vorname = parts[0] ?? "";
  const name = parts.slice(1).join(" ") ?? "";
  return {
    firma: str(row.partner_name),
    seit: "",
    branche: "",
    name: name || str(row.partner_name),
    vorname: vorname,
    gebDatum: "",
    plzOrt,
    strasseHausnummer: str(row.street),
    adresszusatz: str(row.street2),
    telefon: getRowPhone(row),
    mobil: "",
    fax: "",
    email: str(row.email_from),
    lieferPlzOrt: plzOrt,
    lieferStrasse: str(row.street),
    lieferTelefon: getRowPhone(row),
  };
}

function ChevronDown() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0" aria-hidden>
      <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

type Props = {
  leads: CrmRow[];
  buyer: BuyerData;
  onBuyerChange: (b: BuyerData) => void;
};

export function BuyerSection({ leads, buyer, onBuyerChange }: Props) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return leads;
    return leads.filter((row) => {
      const name = str(row.name).toLowerCase();
      const email = str(row.email_from).toLowerCase();
      const phone = getRowPhone(row).toLowerCase();
      const kunde = str(row.partner_name).toLowerCase();
      return name.includes(q) || email.includes(q) || phone.includes(q) || kunde.includes(q);
    });
  }, [leads, search]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    if (dropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [dropdownOpen]);

  const displayLabel = buyer.firma || buyer.email || "Kunde aus CRM wählen…";

  return (
    <div className="space-y-6">
      <div>
        <h2 className="mb-1 text-sm font-bold text-stone-800">Käufer</h2>
        <p className="mb-3 text-xs font-medium text-stone-500">Geschäftsadresse</p>

        <div className="relative mb-4" ref={containerRef}>
          <button
            type="button"
            onClick={() => setDropdownOpen((o) => !o)}
            className="flex w-full items-center justify-between rounded-lg border border-stone-300 bg-white px-3 py-2.5 text-left text-sm text-stone-700 hover:bg-stone-50 focus:outline-none focus:ring-1 focus:ring-stone-500"
            aria-expanded={dropdownOpen}
            aria-haspopup="listbox"
            aria-label="Kunde aus CRM wählen"
          >
            <span className={!buyer.firma && !buyer.email ? "text-stone-400" : ""}>
              {displayLabel}
            </span>
            <ChevronDown />
          </button>
          {dropdownOpen && (
            <div className="absolute left-0 right-0 top-full z-20 mt-1 max-h-80 overflow-hidden rounded-lg border border-stone-300 bg-white shadow-lg">
              <div className="border-b border-stone-200 p-2">
                <input
                  type="search"
                  placeholder="Suchen (Name, E-Mail, Telefon, Kunde)…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full rounded border border-stone-200 px-3 py-2 text-sm focus:border-stone-400 focus:outline-none"
                  aria-label="CRM durchsuchen"
                  autoFocus
                />
              </div>
              <ul
                className="max-h-60 overflow-y-auto py-1"
                role="listbox"
              >
                {filtered.length === 0 ? (
                  <li className="px-3 py-2 text-sm text-stone-500">Keine Treffer.</li>
                ) : (
                  filtered.map((row) => (
                    <li key={row.id}>
                      <button
                        type="button"
                        role="option"
                        className="w-full px-3 py-2 text-left text-sm hover:bg-stone-100 focus:bg-stone-100 focus:outline-none"
                        onClick={() => {
                          onBuyerChange(leadToBuyer(row));
                          setDropdownOpen(false);
                          setSearch("");
                        }}
                      >
                        <span className="font-medium text-stone-800">
                          {str(row.partner_name) || str(row.name) || "—"}
                        </span>
                        {str(row.email_from) && (
                          <span className="ml-2 text-stone-500">{row.email_from}</span>
                        )}
                      </button>
                    </li>
                  ))
                )}
              </ul>
            </div>
          )}
        </div>

        <div className="grid gap-x-4 gap-y-3 sm:grid-cols-3">
          <Field label="Firma" value={buyer.firma} onChange={(v) => onBuyerChange({ ...buyer, firma: v })} />
          <Field label="seit" value={buyer.seit} onChange={(v) => onBuyerChange({ ...buyer, seit: v })} />
          <Field label="Branche" value={buyer.branche} onChange={(v) => onBuyerChange({ ...buyer, branche: v })} />
          <Field label="Name" value={buyer.name} onChange={(v) => onBuyerChange({ ...buyer, name: v })} />
          <Field label="Vorname" value={buyer.vorname} onChange={(v) => onBuyerChange({ ...buyer, vorname: v })} />
          <Field label="Geb.-Datum" value={buyer.gebDatum} onChange={(v) => onBuyerChange({ ...buyer, gebDatum: v })} />
          <Field label="PLZ & Ort" value={buyer.plzOrt} onChange={(v) => onBuyerChange({ ...buyer, plzOrt: v })} />
          <Field label="Straße & Hausnummer" value={buyer.strasseHausnummer} onChange={(v) => onBuyerChange({ ...buyer, strasseHausnummer: v })} />
          <Field label="Adresszusatz" value={buyer.adresszusatz} onChange={(v) => onBuyerChange({ ...buyer, adresszusatz: v })} />
          <Field label="Telefon" value={buyer.telefon} onChange={(v) => onBuyerChange({ ...buyer, telefon: v })} />
          <Field label="Mobil" value={buyer.mobil} onChange={(v) => onBuyerChange({ ...buyer, mobil: v })} />
          <Field label="Fax" value={buyer.fax} onChange={(v) => onBuyerChange({ ...buyer, fax: v })} />
        </div>
        <div className="mt-2 sm:col-span-3">
          <Field label="E-Mail Adresse" value={buyer.email} onChange={(v) => onBuyerChange({ ...buyer, email: v })} fullWidth />
        </div>
      </div>

      <div>
        <h2 className="mb-3 text-sm font-bold text-stone-800">Lieferadresse</h2>
        <div className="grid gap-x-4 gap-y-3 sm:grid-cols-3">
          <Field label="PLZ & Ort" value={buyer.lieferPlzOrt} onChange={(v) => onBuyerChange({ ...buyer, lieferPlzOrt: v })} />
          <Field label="Straße & Hausnummer" value={buyer.lieferStrasse} onChange={(v) => onBuyerChange({ ...buyer, lieferStrasse: v })} />
          <Field label="Telefon" value={buyer.lieferTelefon} onChange={(v) => onBuyerChange({ ...buyer, lieferTelefon: v })} />
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  fullWidth,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  fullWidth?: boolean;
}) {
  return (
    <div className={fullWidth ? "sm:col-span-3" : ""}>
      <label className="mb-0.5 block text-xs text-stone-600">{label}</label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full border-0 border-b border-stone-300 bg-transparent px-0 py-1 text-sm focus:border-stone-500 focus:outline-none focus:ring-0"
      />
    </div>
  );
}

export { emptyBuyer };
