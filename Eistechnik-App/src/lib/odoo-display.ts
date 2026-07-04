/** Coerce Odoo field values (string, false, translated object) to a display string. */
export function odooDisplayValue(value: unknown): string {
  if (value == null || value === false) return "";
  if (typeof value === "string") return value;
  if (typeof value === "number") return String(value);
  if (typeof value === "object") {
    const record = value as Record<string, unknown>;
    for (const key of ["de_DE", "de", "en_US", "en"]) {
      const v = record[key];
      if (typeof v === "string" && v.trim()) return v;
    }
    for (const v of Object.values(record)) {
      if (typeof v === "string" && v.trim()) return v;
    }
  }
  return "";
}
