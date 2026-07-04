"use client";

import {
  buildMonthOptions,
  isEarliestMonth,
  isLatestMonth,
  shiftMonth,
} from "@/lib/ad-auswertung/date-utils";

function ChevronIcon({ direction }: { direction: "left" | "right" }) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      {direction === "left" ? (
        <path d="M15 18l-6-6 6-6" />
      ) : (
        <path d="M9 18l6-6-6-6" />
      )}
    </svg>
  );
}

export function MonthNavigator({
  year,
  month,
  onChange,
}: {
  year: number;
  month: number;
  onChange: (year: number, month: number) => void;
}) {
  const monthOptions = buildMonthOptions();
  const canGoPrev = !isEarliestMonth(year, month);
  const canGoNext = !isLatestMonth(year, month);

  function goPrev() {
    if (!canGoPrev) return;
    const next = shiftMonth(year, month, -1);
    onChange(next.year, next.month);
  }

  function goNext() {
    if (!canGoNext) return;
    const next = shiftMonth(year, month, 1);
    onChange(next.year, next.month);
  }

  const navBtnClass = (enabled: boolean) =>
    `flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border transition ${
      enabled
        ? "border-stone-300 bg-white text-stone-700 hover:border-stone-400 hover:bg-stone-50"
        : "cursor-not-allowed border-stone-200 bg-stone-100 text-stone-300"
    }`;

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={goPrev}
        disabled={!canGoPrev}
        className={navBtnClass(canGoPrev)}
        aria-label="Vorheriger Monat"
        title="Vorheriger Monat"
      >
        <ChevronIcon direction="left" />
      </button>

      <select
        value={`${year}-${month}`}
        onChange={(e) => {
          const [y, m] = e.target.value.split("-").map(Number);
          onChange(y, m);
        }}
        className="min-w-0 flex-1 rounded-lg border border-stone-300 px-3 py-2 text-sm"
      >
        {monthOptions.map((opt) => (
          <option key={`${opt.year}-${opt.month}`} value={`${opt.year}-${opt.month}`}>
            {opt.label}
          </option>
        ))}
      </select>

      <button
        type="button"
        onClick={goNext}
        disabled={!canGoNext}
        className={navBtnClass(canGoNext)}
        aria-label="Nächster Monat"
        title="Nächster Monat"
      >
        <ChevronIcon direction="right" />
      </button>
    </div>
  );
}
