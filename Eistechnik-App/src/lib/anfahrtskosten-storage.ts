import {
  DEFAULT_DISTANCE_KM,
  DEFAULT_EUR_PER_KM,
  DEFAULT_TECHNICIAN_HOURLY,
  DEFAULT_WORK_MINUTES,
} from "@/lib/anfahrtskosten";

export const STORAGE_MANUAL_KEY = "anfahrtskosten-manual-v1";
export const STORAGE_CUSTOMER_KEY = "anfahrtskosten-customer-v1";

export type CalculatorState = {
  distanceKm: number;
  workMinutes: number;
  eurPerKmInput: string;
  technicianHourlyInput: string;
};

export type ManualState = CalculatorState & {
  manualAddressQuery: string;
  manualSelectedAddress: string;
  routeKmRaw: number | null;
};

export type CustomerState = CalculatorState & {
  selectedLeadId: number | null;
  selectedAddress: string;
  routeKmRaw: number | null;
};

export function defaultManualState(): ManualState {
  return {
    distanceKm: DEFAULT_DISTANCE_KM,
    workMinutes: DEFAULT_WORK_MINUTES,
    eurPerKmInput: DEFAULT_EUR_PER_KM,
    technicianHourlyInput: DEFAULT_TECHNICIAN_HOURLY,
    manualAddressQuery: "",
    manualSelectedAddress: "",
    routeKmRaw: null,
  };
}

export function defaultCustomerState(): CustomerState {
  return {
    distanceKm: DEFAULT_DISTANCE_KM,
    workMinutes: DEFAULT_WORK_MINUTES,
    eurPerKmInput: DEFAULT_EUR_PER_KM,
    technicianHourlyInput: DEFAULT_TECHNICIAN_HOURLY,
    selectedLeadId: null,
    selectedAddress: "",
    routeKmRaw: null,
  };
}

function normalizeCalculator(raw: Partial<CalculatorState>, base: CalculatorState): CalculatorState {
  const distanceKm = Number(raw.distanceKm);
  const workMinutes = Number(raw.workMinutes);
  return {
    distanceKm:
      Number.isFinite(distanceKm) && distanceKm >= 1
        ? Math.round(distanceKm)
        : base.distanceKm,
    workMinutes:
      Number.isFinite(workMinutes) && workMinutes >= 0
        ? Math.round(workMinutes)
        : base.workMinutes,
    eurPerKmInput:
      typeof raw.eurPerKmInput === "string" ? raw.eurPerKmInput : base.eurPerKmInput,
    technicianHourlyInput:
      typeof raw.technicianHourlyInput === "string"
        ? raw.technicianHourlyInput
        : base.technicianHourlyInput,
  };
}

export function loadManualState(): ManualState {
  if (typeof window === "undefined") return defaultManualState();
  try {
    const cached = window.localStorage.getItem(STORAGE_MANUAL_KEY);
    if (!cached) return defaultManualState();
    const raw = JSON.parse(cached) as Partial<ManualState>;
    const base = defaultManualState();
    const routeKmRaw =
      raw.routeKmRaw == null ? null : Number.isFinite(Number(raw.routeKmRaw)) ? Number(raw.routeKmRaw) : null;
    return {
      ...base,
      ...normalizeCalculator(raw, base),
      manualAddressQuery:
        typeof raw.manualAddressQuery === "string" ? raw.manualAddressQuery : "",
      manualSelectedAddress:
        typeof raw.manualSelectedAddress === "string" ? raw.manualSelectedAddress : "",
      routeKmRaw,
    };
  } catch {
    return defaultManualState();
  }
}

export function loadCustomerState(): CustomerState {
  if (typeof window === "undefined") return defaultCustomerState();
  try {
    const cached = window.localStorage.getItem(STORAGE_CUSTOMER_KEY);
    if (!cached) return defaultCustomerState();
    const raw = JSON.parse(cached) as Partial<CustomerState>;
    const base = defaultCustomerState();
    const routeKmRaw =
      raw.routeKmRaw == null ? null : Number.isFinite(Number(raw.routeKmRaw)) ? Number(raw.routeKmRaw) : null;
    const selectedLeadId =
      raw.selectedLeadId == null ? null : Number.isFinite(Number(raw.selectedLeadId)) ? Number(raw.selectedLeadId) : null;
    return {
      ...base,
      ...normalizeCalculator(raw, base),
      selectedLeadId,
      selectedAddress: typeof raw.selectedAddress === "string" ? raw.selectedAddress : "",
      routeKmRaw,
    };
  } catch {
    return defaultCustomerState();
  }
}

export function saveAnfahrtskostenState(manual: ManualState, customer: CustomerState) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_MANUAL_KEY, JSON.stringify(manual));
  window.localStorage.setItem(STORAGE_CUSTOMER_KEY, JSON.stringify(customer));
}

export function clearAnfahrtskostenState() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STORAGE_MANUAL_KEY);
  window.localStorage.removeItem(STORAGE_CUSTOMER_KEY);
}
