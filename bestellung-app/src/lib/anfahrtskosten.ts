export const HQ_ADDRESS = "Jüterbogerstraße 31A, 14943 Luckenwalde, Deutschland";
export const DEFAULT_EUR_PER_KM = "1,40";
export const DEFAULT_TECHNICIAN_HOURLY = "95";
export const DEFAULT_DISTANCE_KM = 1;
export const DEFAULT_WORK_MINUTES = 0;
export const MAX_DISTANCE_KM = 1000;
export const MAX_WORK_MINUTES = 16 * 60;

export type CostCalculation = {
  travelKmCost: number;
  rawDrivingMinutes: number;
  roundedDrivingMinutes: number;
  travelTechnicianCost: number;
  travelTotal: number;
  workTotal: number;
  total: number;
};

export function parseGermanDecimal(value: string): number {
  const normalized = value.replace(",", ".").trim();
  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function roundUpToQuarterHour(minutes: number): number {
  return Math.ceil(minutes / 15) * 15;
}

export function formatEuro(value: number): string {
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
  }).format(value);
}

export function formatHoursFromMinutes(minutes: number): string {
  const hours = minutes / 60;
  return `${hours.toLocaleString("de-DE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} h`;
}

export function calculateCosts(
  distanceKm: number,
  eurPerKm: number,
  technicianHourly: number,
  workMinutes: number
): CostCalculation {
  const travelKmCost = distanceKm * eurPerKm;
  const rawDrivingMinutes = (distanceKm / 100) * 70;
  const roundedDrivingMinutes = roundUpToQuarterHour(rawDrivingMinutes);
  const technicianTravelRatePerHour = technicianHourly / 2;
  const travelTechnicianCost =
    (roundedDrivingMinutes / 60) * technicianTravelRatePerHour;
  const travelTotal = travelKmCost + travelTechnicianCost;
  const workTotal = (workMinutes / 60) * technicianHourly;
  const total = travelTotal + workTotal;

  return {
    travelKmCost,
    rawDrivingMinutes,
    roundedDrivingMinutes,
    travelTechnicianCost,
    travelTotal,
    workTotal,
    total,
  };
}
