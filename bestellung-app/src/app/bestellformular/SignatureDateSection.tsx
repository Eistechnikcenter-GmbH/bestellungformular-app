"use client";

import { useRef, useState, useEffect } from "react";

/** Today in YYYY-MM-DD for input type="date". */
function getTodayISO(): string {
  const d = new Date();
  return d.toISOString().slice(0, 10);
}

/** Format YYYY-MM-DD to DD.MM.YYYY. */
function formatDDMMYYYY(iso: string): string {
  if (!iso || iso.length < 10) return "";
  const [y, m, d] = iso.split("-");
  return `${d}.${m}.${y}`;
}

/** Parse DD.MM.YYYY or partial input to YYYY-MM-DD if possible. */
function parseToISO(value: string): string | null {
  const match = value.trim().match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
  if (!match) return null;
  const [, d, m, y] = match;
  const day = parseInt(d, 10);
  const month = parseInt(m, 10);
  const year = parseInt(y, 10);
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  const date = new Date(year, month - 1, day);
  if (isNaN(date.getTime())) return null;
  return date.toISOString().slice(0, 10);
}

function CalendarIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0 text-stone-500" aria-hidden>
      <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2" />
      <path d="M3 10h18M7 2v4M17 2v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function SignatureDateSection() {
  const [dateValue, setDateValue] = useState<string>(() => getTodayISO());
  const [displayInput, setDisplayInput] = useState<string>(() => formatDDMMYYYY(getTodayISO()));
  const dateInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setDisplayInput(formatDDMMYYYY(dateValue));
  }, [dateValue]);

  const openCalendar = () => {
    try {
      dateInputRef.current?.showPicker?.();
    } catch {
      dateInputRef.current?.click();
    }
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    if (v) setDateValue(v);
  };

  const handleDisplayChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    setDisplayInput(v);
    const parsed = parseToISO(v);
    if (parsed) setDateValue(parsed);
  };

  const handleDisplayBlur = () => {
    const parsed = parseToISO(displayInput);
    if (parsed) {
      setDateValue(parsed);
      setDisplayInput(formatDDMMYYYY(parsed));
    } else {
      setDisplayInput(formatDDMMYYYY(dateValue));
    }
  };

  return (
    <section className="mb-8 text-sm text-stone-700">
      <p className="mb-3">
        Es bestehen keine mündlichen Nebenabreden / Vereinbarungen.
      </p>
      <p className="mb-2">
        Kunde stimmt Bonitätsprüfung (Crefo/Schufa) zu.
      </p>
      <div className="mb-6 border-b border-stone-400 pb-1 pt-4">
        <span className="text-xs text-stone-500">Unterschrift Kunde</span>
      </div>

      <div className="mb-4 text-stone-600">
        <p className="mb-2 font-medium text-stone-800">Widerrufsbelehrung</p>
        <p className="mb-2">
          Sie haben das Recht, binnen vierzehn Tagen ohne Angabe von Gründen diesen
          Vertrag zu widerrufen. Die Widerrufsfrist beträgt vierzehn Tage ab dem Tag
          an dem Sie oder ein von Ihnen benannter Dritter die Waren in Besitz genommen
          haben. Um Ihr Widerrufsrecht auszuüben, müssen Sie uns mittels einer
          eindeutigen Erklärung (z. B. ein mit der Post versandter Brief oder E-Mail)
          über Ihren Entschluss, diesen Vertrag zu widerrufen, informieren.
        </p>
        <p className="font-medium text-stone-800">Widerrufsfolgen</p>
        <p>
          Wenn Sie diesen Vertrag widerrufen, haben wir Ihnen alle Zahlungen, die wir
          von Ihnen erhalten haben, einschließlich der Lieferkosten (mit Ausnahme der
          zusätzlichen Kosten, die sich aus der Wahl einer anderen Art der Lieferung
          als der von uns angebotenen günstigsten Standardlieferung ergeben), 
          unverzüglich und spätestens binnen vierzehn Tagen ab dem Tag zurückzuzahlen,
          an dem die Mitteilung über Ihren Widerruf dieses Vertrags bei uns eingegangen
          ist.
        </p>
      </div>

      <div className="mt-8 flex flex-wrap items-end gap-8 border-t border-stone-200 pt-6">
        <div className="flex items-center gap-2">
          <label className="text-xs font-medium text-stone-600">Datum</label>
          <div className="flex items-center gap-1.5 rounded border border-stone-300 bg-white">
            <input
              type="text"
              value={displayInput}
              onChange={handleDisplayChange}
              onBlur={handleDisplayBlur}
              placeholder="TT.MM.JJJJ"
              className="w-28 border-0 bg-transparent px-2 py-1.5 text-stone-800 focus:outline-none"
              aria-label="Datum (TT.MM.JJJJ)"
            />
            <input
              ref={dateInputRef}
              type="date"
              value={dateValue}
              onChange={handleDateChange}
              className="sr-only"
              aria-hidden
            />
            <button
              type="button"
              onClick={openCalendar}
              title="Kalender öffnen"
              className="rounded-r border-0 bg-stone-100 p-1.5 text-stone-600 hover:bg-stone-200 focus:outline-none"
            >
              <CalendarIcon />
            </button>
          </div>
        </div>
        <div className="flex-1 min-w-[140px] border-b border-stone-400 pb-1">
          <span className="text-xs text-stone-500">In Vertretung Verkäufer</span>
        </div>
        <div className="flex-1 min-w-[140px] border-b border-stone-400 pb-1">
          <span className="text-xs text-stone-500">
            Verbindliche Bestellung des Käufers Unterschrift / Stempel
          </span>
        </div>
      </div>
    </section>
  );
}
