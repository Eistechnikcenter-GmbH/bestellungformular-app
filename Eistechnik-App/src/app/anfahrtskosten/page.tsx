"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { V1_HOME } from "@/lib/cdn-assets";
import {
  calculateCosts,
  DEFAULT_DISTANCE_KM,
  formatEuro,
  formatHoursFromMinutes,
  HQ_ADDRESS,
  MAX_DISTANCE_KM,
  MAX_WORK_MINUTES,
  parseGermanDecimal,
} from "@/lib/anfahrtskosten";
import {
  clearAnfahrtskostenState,
  defaultCustomerState,
  defaultManualState,
  loadCustomerState,
  loadManualState,
  saveAnfahrtskostenState,
  type CalculatorState,
  type CustomerState,
  type ManualState,
} from "@/lib/anfahrtskosten-storage";

type TabId = "manuell" | "kundenadresse";

type LeadAddressRow = {
  id: number;
  label: string;
  address: string;
};

function lacksPostalCode(address: string): boolean {
  return address.trim().length > 0 && !/\b\d{5}\b/.test(address);
}

export default function AnfahrtskostenPage() {
  const [activeTab, setActiveTab] = useState<TabId>("manuell");
  const [manualState, setManualState] = useState<ManualState>(defaultManualState);
  const [customerState, setCustomerState] = useState<CustomerState>(defaultCustomerState);
  const [storageReady, setStorageReady] = useState(false);
  const manualStateRef = useRef(manualState);
  const customerStateRef = useRef(customerState);
  const suggestTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const suggestAbortRef = useRef<AbortController | null>(null);
  const [leads, setLeads] = useState<LeadAddressRow[]>([]);
  const [leadsLoading, setLeadsLoading] = useState(true);
  const [leadsError, setLeadsError] = useState<string | null>(null);
  const [routeLoading, setRouteLoading] = useState(false);
  const [routeError, setRouteError] = useState<string | null>(null);
  const [customerSearchOpen, setCustomerSearchOpen] = useState(false);
  const [customerSearch, setCustomerSearch] = useState("");
  const customerSearchRef = useRef<HTMLDivElement>(null);
  const [manualSuggestOpen, setManualSuggestOpen] = useState(false);
  const [manualSuggestions, setManualSuggestions] = useState<
    Array<{ label: string; address: string }>
  >([]);
  const [manualSuggestLoading, setManualSuggestLoading] = useState(false);
  const [manualSuggestError, setManualSuggestError] = useState<string | null>(null);

  manualStateRef.current = manualState;
  customerStateRef.current = customerState;

  useEffect(() => {
    setManualState(loadManualState());
    setCustomerState(loadCustomerState());
    setStorageReady(true);
  }, []);

  useEffect(() => {
    if (!storageReady) return;
    const persist = () => {
      saveAnfahrtskostenState(manualStateRef.current, customerStateRef.current);
    };
    window.addEventListener("beforeunload", persist);
    return () => window.removeEventListener("beforeunload", persist);
  }, [storageReady]);

  useEffect(() => {
    return () => {
      if (suggestTimerRef.current) clearTimeout(suggestTimerRef.current);
      suggestAbortRef.current?.abort();
    };
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        customerSearchRef.current &&
        !customerSearchRef.current.contains(e.target as Node)
      ) {
        setCustomerSearchOpen(false);
      }
    }
    if (customerSearchOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [customerSearchOpen]);

  useEffect(() => {
    const loadLeads = async () => {
      setLeadsLoading(true);
      setLeadsError(null);
      try {
        const res = await fetch("/api/anfahrtskosten/leads", { cache: "no-store" });
        const json = (await res.json()) as LeadAddressRow[] | { error?: string };
        if (!res.ok) {
          throw new Error(
            "error" in json ? json.error ?? "CRM-Daten konnten nicht geladen werden." : "CRM-Daten konnten nicht geladen werden."
          );
        }
        setLeads(json as LeadAddressRow[]);
      } catch (e) {
        setLeadsError(e instanceof Error ? e.message : "CRM-Daten konnten nicht geladen werden.");
      } finally {
        setLeadsLoading(false);
      }
    };
    void loadLeads();
  }, []);

  const activeState = activeTab === "manuell" ? manualState : customerState;
  const eurPerKm = parseGermanDecimal(activeState.eurPerKmInput);
  const technicianHourly = parseGermanDecimal(activeState.technicianHourlyInput);
  const calculation = useMemo(
    () =>
      calculateCosts(
        activeState.distanceKm,
        eurPerKm,
        technicianHourly,
        activeState.workMinutes
      ),
    [activeState.distanceKm, activeState.workMinutes, eurPerKm, technicianHourly]
  );

  const updateActiveState = (patch: Partial<CalculatorState>) => {
    if (activeTab === "manuell") {
      setManualState((prev) => ({ ...prev, ...patch }));
      return;
    }
    setCustomerState((prev) => ({ ...prev, ...patch }));
  };

  const filteredLeads = useMemo(() => {
    const q = customerSearch.trim().toLowerCase();
    if (!q) return leads;
    return leads.filter((lead) => {
      const haystack = `${lead.label} ${lead.address}`.toLowerCase();
      return haystack.includes(q);
    });
  }, [customerSearch, leads]);

  const handleSelectLead = (leadId: number) => {
    const lead = leads.find((item) => item.id === leadId);
    setCustomerState((prev) => ({
      ...prev,
      selectedLeadId: leadId,
      selectedAddress: lead?.address ?? "",
    }));
    setCustomerSearchOpen(false);
    setCustomerSearch("");
  };

  const calculateRoute = async (destination: string) => {
    if (!destination.trim()) {
      setRouteError("Bitte zuerst eine Adresse wählen.");
      return;
    }
    setRouteLoading(true);
    setRouteError(null);
    try {
      const res = await fetch("/api/anfahrtskosten/route", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          origin: HQ_ADDRESS,
          destination,
        }),
      });
      const json = (await res.json()) as {
        km?: number;
        kmRounded?: number;
        error?: string;
      };
      if (!res.ok || typeof json.kmRounded !== "number") {
        throw new Error(json.error ?? "Distanz konnte nicht berechnet werden.");
      }
      return {
        kmRounded: json.kmRounded ?? DEFAULT_DISTANCE_KM,
        kmRaw: typeof json.km === "number" ? json.km : null,
      };
    } catch (e) {
      setRouteError(e instanceof Error ? e.message : "Distanz konnte nicht berechnet werden.");
      return null;
    } finally {
      setRouteLoading(false);
    }
  };

  const handleRouteCalculationCustomer = async () => {
    const route = await calculateRoute(customerState.selectedAddress);
    if (!route) return;
    setCustomerState((prev) => ({
      ...prev,
      distanceKm: route.kmRounded,
      routeKmRaw: route.kmRaw,
    }));
  };

  const handleRouteCalculationManual = async () => {
    const destination = manualState.manualSelectedAddress || manualState.manualAddressQuery;
    const route = await calculateRoute(destination);
    if (!route) return;
    setManualState((prev) => ({
      ...prev,
      distanceKm: route.kmRounded,
      routeKmRaw: route.kmRaw,
      manualSelectedAddress: destination,
    }));
  };

  const fetchSuggestions = useCallback(async (query: string) => {
    suggestAbortRef.current?.abort();
    const controller = new AbortController();
    suggestAbortRef.current = controller;

    if (query.length < 3) {
      setManualSuggestions([]);
      setManualSuggestOpen(false);
      setManualSuggestLoading(false);
      setManualSuggestError(null);
      return;
    }

    setManualSuggestLoading(true);
    setManualSuggestError(null);
    try {
      const res = await fetch(
        `/api/anfahrtskosten/suggest?q=${encodeURIComponent(query)}`,
        { signal: controller.signal }
      );
      const json = (await res.json()) as
        | Array<{ label: string; address: string }>
        | { error?: string };
      if (!res.ok) {
        throw new Error(
          "error" in json
            ? json.error ?? "Adressvorschläge konnten nicht geladen werden."
            : "Adressvorschläge konnten nicht geladen werden."
        );
      }
      setManualSuggestions(json as Array<{ label: string; address: string }>);
      setManualSuggestOpen(true);
    } catch (e) {
      if (e instanceof DOMException && e.name === "AbortError") return;
      setManualSuggestError(
        e instanceof Error
          ? e.message
          : "Adressvorschläge konnten nicht geladen werden."
      );
    } finally {
      setManualSuggestLoading(false);
    }
  }, []);

  const handleManualAddressChange = (value: string) => {
    setManualState((prev) => ({
      ...prev,
      manualAddressQuery: value,
      manualSelectedAddress: "",
    }));

    if (suggestTimerRef.current) clearTimeout(suggestTimerRef.current);
    if (value.trim().length < 3) {
      void fetchSuggestions("");
      return;
    }
    suggestTimerRef.current = setTimeout(() => {
      void fetchSuggestions(value.trim());
    }, 350);
  };

  const handleResetAll = () => {
    setManualState(defaultManualState());
    setCustomerState(defaultCustomerState());
    clearAnfahrtskostenState();
    setManualSuggestions([]);
    setManualSuggestOpen(false);
    setManualSuggestError(null);
  };

  return (
    <div className="min-h-screen bg-stone-100 p-4 sm:p-6 md:p-8">
      <div className="mx-auto max-w-3xl">
        <div className="mb-6 flex items-center gap-4">
          <Link
            href={V1_HOME}
            className="rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50"
          >
            ← Übersicht
          </Link>
          <h1 className="text-xl font-semibold text-stone-800 sm:text-2xl">
            Anfahrtskosten
          </h1>
        </div>

        <div className="rounded-xl border border-stone-300 bg-white p-6 shadow-sm">
          <p className="mb-6 text-sm text-stone-600">
            Schnelle Kalkulation für Anfahrt und Arbeitszeit.
          </p>

          <div className="mb-6 inline-flex rounded-lg border border-stone-300 bg-stone-50 p-1">
            <button
              type="button"
              onClick={() => setActiveTab("manuell")}
              className={`rounded-md px-3 py-1.5 text-sm font-medium ${activeTab === "manuell" ? "bg-white text-stone-800 shadow-sm" : "text-stone-600"}`}
            >
              Manuell
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("kundenadresse")}
              className={`rounded-md px-3 py-1.5 text-sm font-medium ${activeTab === "kundenadresse" ? "bg-white text-stone-800 shadow-sm" : "text-stone-600"}`}
            >
              Kundenadresse
            </button>
          </div>

          {activeTab === "kundenadresse" && (
            <section className="mb-6 rounded-lg border border-stone-200 bg-stone-50 p-4">
              <p className="mb-3 text-xs text-stone-600">Startadresse (HQ): {HQ_ADDRESS}</p>
              <div className="relative" ref={customerSearchRef}>
                <button
                  type="button"
                  disabled={leadsLoading}
                  onClick={() => setCustomerSearchOpen((v) => !v)}
                  className="flex w-full items-center justify-between rounded border border-stone-300 bg-white px-3 py-2 text-left text-sm text-stone-800 disabled:opacity-50"
                >
                  <span>
                    {customerState.selectedLeadId
                      ? leads.find((l) => l.id === customerState.selectedLeadId)?.label ??
                        "Kunde gewählt"
                      : leadsLoading
                        ? "Lade CRM-Daten..."
                        : "Kunde/Kontakt aus CRM suchen..."}
                  </span>
                  <span className="text-xs text-stone-500">Suchen</span>
                </button>
                {customerSearchOpen && (
                  <div className="absolute left-0 right-0 top-full z-20 mt-1 max-h-80 overflow-hidden rounded-lg border border-stone-300 bg-white shadow-lg">
                    <div className="border-b border-stone-200 p-2">
                      <input
                        type="search"
                        placeholder="Suchen (Kunde, Kontakt, Adresse)..."
                        value={customerSearch}
                        onChange={(e) => setCustomerSearch(e.target.value)}
                        className="w-full rounded border border-stone-200 px-3 py-2 text-sm focus:border-stone-400 focus:outline-none"
                        autoFocus
                      />
                    </div>
                    <ul className="max-h-60 overflow-y-auto py-1">
                      {filteredLeads.length === 0 ? (
                        <li className="px-3 py-2 text-sm text-stone-500">Keine Treffer.</li>
                      ) : (
                        filteredLeads.map((lead) => (
                          <li key={lead.id}>
                            <button
                              type="button"
                              className="w-full px-3 py-2 text-left text-sm hover:bg-stone-100"
                              onClick={() => handleSelectLead(lead.id)}
                            >
                              <div className="font-medium text-stone-800">{lead.label}</div>
                              <div className="text-xs text-stone-600">{lead.address}</div>
                            </button>
                          </li>
                        ))
                      )}
                    </ul>
                  </div>
                )}
              </div>
              {leadsError && <p className="mt-2 text-sm text-rose-700">{leadsError}</p>}
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => void handleRouteCalculationCustomer()}
                  disabled={routeLoading || !customerState.selectedAddress}
                  className="rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm font-medium text-stone-700 hover:bg-stone-100 disabled:opacity-50"
                >
                  {routeLoading ? "Berechne Distanz..." : "Distanz aus Kundenadresse berechnen"}
                </button>
              </div>
              {customerState.selectedAddress && (
                <p className="mt-2 text-xs text-stone-600">
                  Zieladresse: {customerState.selectedAddress}
                </p>
              )}
              {customerState.selectedAddress && lacksPostalCode(customerState.selectedAddress) && (
                <p className="mt-1 text-xs text-amber-700">
                  Hinweis: In Odoo fehlt Straße/PLZ für diesen Kontakt. Bitte Adresse in Odoo
                  ergänzen oder im Tab Manuell mit vollständiger Adresse rechnen.
                </p>
              )}
              {customerState.routeKmRaw != null && (
                <p className="mt-1 text-xs text-stone-600">
                  API-Routenwert: {customerState.routeKmRaw.toFixed(1)} km
                </p>
              )}
              {routeError && <p className="mt-2 text-sm text-rose-700">{routeError}</p>}
            </section>
          )}

          {activeTab === "manuell" && (
            <section className="mb-6 rounded-lg border border-stone-200 bg-stone-50 p-4">
              <p className="mb-3 text-xs text-stone-600">Startadresse (HQ): {HQ_ADDRESS}</p>
              <label className="text-sm text-stone-700">
                <span className="mb-1 block text-xs font-medium text-stone-600">
                  Zieladresse (mit Vorschlägen)
                </span>
                <input
                  type="search"
                  value={manualState.manualAddressQuery}
                  onChange={(e) => handleManualAddressChange(e.target.value)}
                  placeholder="Adresse eingeben..."
                  className="w-full rounded border border-stone-300 bg-white px-3 py-2 text-sm text-stone-800 focus:outline-none focus:ring-2 focus:ring-stone-400"
                />
              </label>
              {manualSuggestLoading && (
                <p className="mt-2 text-xs text-stone-500">Lade Vorschläge...</p>
              )}
              {manualSuggestError && (
                <p className="mt-2 text-xs text-rose-700">{manualSuggestError}</p>
              )}
              {manualSuggestOpen && manualSuggestions.length > 0 && (
                <ul className="mt-2 max-h-40 overflow-auto rounded border border-stone-200 bg-white">
                  {manualSuggestions.map((item) => (
                    <li key={item.label}>
                      <button
                        type="button"
                        className="w-full px-3 py-2 text-left text-sm hover:bg-stone-100"
                        onClick={() => {
                          setManualState((prev) => ({
                            ...prev,
                            manualAddressQuery: item.label,
                            manualSelectedAddress: item.address,
                          }));
                          setManualSuggestOpen(false);
                        }}
                      >
                        {item.label}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              <div className="mt-3 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => void handleRouteCalculationManual()}
                  disabled={
                    routeLoading ||
                    !(manualState.manualSelectedAddress || manualState.manualAddressQuery.trim())
                  }
                  className="rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm font-medium text-stone-700 hover:bg-stone-100 disabled:opacity-50"
                >
                  {routeLoading ? "Berechne Distanz..." : "Distanz aus Adresse berechnen"}
                </button>
              </div>
              {(manualState.manualSelectedAddress || manualState.manualAddressQuery) && (
                <p className="mt-2 text-xs text-stone-600">
                  Zieladresse: {manualState.manualSelectedAddress || manualState.manualAddressQuery}
                </p>
              )}
              {manualState.routeKmRaw != null && (
                <p className="mt-1 text-xs text-stone-600">
                  API-Routenwert: {manualState.routeKmRaw.toFixed(1)} km
                </p>
              )}
            </section>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="text-sm text-stone-700">
              <span className="mb-1 block text-xs font-medium text-stone-600">
                Euro pro Kilometer (€/km)
              </span>
              <input
                type="text"
                inputMode="decimal"
                value={activeState.eurPerKmInput}
                onChange={(e) => updateActiveState({ eurPerKmInput: e.target.value })}
                className="w-full rounded border border-stone-300 bg-white px-3 py-2 text-sm text-stone-800 focus:outline-none focus:ring-2 focus:ring-stone-400"
              />
            </label>

            <label className="text-sm text-stone-700">
              <span className="mb-1 block text-xs font-medium text-stone-600">
                Technikerstunde (€/h)
              </span>
              <input
                type="text"
                inputMode="decimal"
                value={activeState.technicianHourlyInput}
                onChange={(e) =>
                  updateActiveState({ technicianHourlyInput: e.target.value })
                }
                className="w-full rounded border border-stone-300 bg-white px-3 py-2 text-sm text-stone-800 focus:outline-none focus:ring-2 focus:ring-stone-400"
              />
            </label>
          </div>

          <section className="mt-8">
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-stone-800">
                Anfahrtsstrecke
              </h2>
              <span className="rounded bg-stone-100 px-2 py-1 text-sm font-medium text-stone-700">
                {activeState.distanceKm} km
              </span>
            </div>
            <input
              type="range"
              min={1}
              max={MAX_DISTANCE_KM}
              step={1}
              value={activeState.distanceKm}
              onChange={(e) => updateActiveState({ distanceKm: Number(e.target.value) })}
              className="w-full accent-stone-700"
            />
            <div className="mt-2">
              <label className="text-xs text-stone-600">Kilometer manuell eingeben</label>
              <input
                type="number"
                min={1}
                max={MAX_DISTANCE_KM}
                step={1}
                value={activeState.distanceKm}
                onChange={(e) => {
                  const v = Number(e.target.value);
                  if (!Number.isFinite(v)) return;
                  const clamped = Math.max(1, Math.min(MAX_DISTANCE_KM, Math.round(v)));
                  updateActiveState({ distanceKm: clamped });
                }}
                className="mt-1 w-full max-w-xs rounded border border-stone-300 bg-white px-3 py-2 text-sm text-stone-800 focus:outline-none focus:ring-2 focus:ring-stone-400"
              />
            </div>
            <div className="mt-3 grid gap-2 rounded-lg border border-stone-200 bg-stone-50 p-3 text-sm text-stone-700 sm:grid-cols-2">
              <div>Kilometerkosten: {formatEuro(calculation.travelKmCost)}</div>
              <div>
                Fahrzeit (gerundet):{" "}
                {formatHoursFromMinutes(calculation.roundedDrivingMinutes)}
              </div>
              <div className="sm:col-span-2">
                Technikeranteil Fahrt (1/2 Satz, je angefangene 15 Min):
                {" "}
                {formatEuro(calculation.travelTechnicianCost)}
              </div>
            </div>
          </section>

          <section className="mt-8">
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-stone-800">
                Arbeitszeit
              </h2>
              <span className="rounded bg-stone-100 px-2 py-1 text-sm font-medium text-stone-700">
                {activeState.workMinutes} Min
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={MAX_WORK_MINUTES}
              step={15}
              value={activeState.workMinutes}
              onChange={(e) =>
                updateActiveState({ workMinutes: Number(e.target.value) })
              }
              className="w-full accent-stone-700"
            />
            <p className="mt-2 text-sm text-stone-600">
              Arbeitszeit in 15-Minuten-Schritten:{" "}
              {formatHoursFromMinutes(activeState.workMinutes)}
            </p>
          </section>

          <section className="mt-8 space-y-2 rounded-lg border border-stone-200 bg-stone-50 p-4 text-sm text-stone-800">
            <div className="flex items-center justify-between">
              <span>Anfahrtskosten gesamt</span>
              <strong>{formatEuro(calculation.travelTotal)}</strong>
            </div>
            <div className="flex items-center justify-between">
              <span>Arbeitszeit gesamt</span>
              <strong>{formatEuro(calculation.workTotal)}</strong>
            </div>
            <div className="flex items-center justify-between border-t border-stone-300 pt-2 text-base">
              <span>Gesamt</span>
              <strong>{formatEuro(calculation.total)}</strong>
            </div>
          </section>

          <div className="mt-6 flex justify-end">
            <button
              type="button"
              onClick={handleResetAll}
              className="rounded-lg border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50 focus:outline-none"
            >
              Zurücksetzen
            </button>
          </div>

          <p className="mt-4 text-xs text-stone-500">
            Fahrzeitformel: 1 h 10 min je 100 km, auf angefangene 15 Minuten
            aufgerundet. Für die Fahrt wird die Technikerstunde mit 50 % angesetzt.
          </p>
          <p className="mt-1 text-xs text-stone-500">
            Rohwert Fahrzeit: {formatHoursFromMinutes(calculation.rawDrivingMinutes)}.
          </p>
        </div>
      </div>
    </div>
  );
}
