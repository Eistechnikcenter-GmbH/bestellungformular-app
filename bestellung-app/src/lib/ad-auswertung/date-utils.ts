export const MONTH_NAMES = [
  "Januar",
  "Februar",
  "März",
  "April",
  "Mai",
  "Juni",
  "Juli",
  "August",
  "September",
  "Oktober",
  "November",
  "Dezember",
] as const;

export const RANGE_START_YEAR = 2026;
export const RANGE_START_MONTH = 1;

export type YearMonth = { year: number; month: number };

export function getCurrentYearMonth(): YearMonth {
  const now = new Date();
  return { year: now.getFullYear(), month: now.getMonth() + 1 };
}

export function monthLabel(year: number, month: number): string {
  return `${MONTH_NAMES[month - 1]} ${year}`;
}

/** Jan 2026 through the current calendar month (inclusive). */
export function buildMonthOptions(): { year: number; month: number; label: string }[] {
  const { year: endYear, month: endMonth } = getCurrentYearMonth();
  const options: { year: number; month: number; label: string }[] = [];

  for (let year = RANGE_START_YEAR; year <= endYear; year++) {
    const monthStart = year === RANGE_START_YEAR ? RANGE_START_MONTH : 1;
    const monthEnd = year === endYear ? endMonth : 12;
    for (let month = monthStart; month <= monthEnd; month++) {
      options.push({ year, month, label: monthLabel(year, month) });
    }
  }
  return options;
}

export function isEarliestMonth(year: number, month: number): boolean {
  return year === RANGE_START_YEAR && month === RANGE_START_MONTH;
}

export function isLatestMonth(year: number, month: number): boolean {
  const { year: cy, month: cm } = getCurrentYearMonth();
  return year === cy && month === cm;
}

export function shiftMonth(year: number, month: number, delta: number): YearMonth {
  const d = new Date(year, month - 1 + delta, 1);
  return { year: d.getFullYear(), month: d.getMonth() + 1 };
}

export function pad(n: number): string {
  return String(n).padStart(2, "0");
}

export function lastDayOfMonth(year: number, month: number): string {
  return `${year}-${pad(month)}-${pad(new Date(year, month, 0).getDate())}`;
}

export function todayIso(): string {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
