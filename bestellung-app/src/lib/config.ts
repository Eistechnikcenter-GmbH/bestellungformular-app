/**
 * App and Odoo config from environment.
 * Switch to production by changing .env: ODOO_BASE_URL, ODOO_API_KEY, NEXT_PUBLIC_APP_DOMAIN.
 */

function requireEnv(name: string): string {
  const value = process.env[name];
  if (value == null || value === "") {
    throw new Error(`Missing required env: ${name}`);
  }
  return value;
}

export const odooConfig = {
  baseUrl: process.env.ODOO_BASE_URL ?? "",
  apiKey: process.env.ODOO_API_KEY ?? "",
  database: process.env.ODOO_DATABASE ?? undefined,
};

export const appConfig = {
  domain: process.env.NEXT_PUBLIC_APP_DOMAIN ?? "http://localhost:3000",
};

/** Use only in API routes / server; ensures API key is set. */
export function getOdooConfig() {
  return {
    baseUrl: requireEnv("ODOO_BASE_URL").replace(/\/$/, ""),
    apiKey: requireEnv("ODOO_API_KEY"),
    database: process.env.ODOO_DATABASE ?? undefined,
  };
}
