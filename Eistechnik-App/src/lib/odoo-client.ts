/**
 * Odoo JSON-2 API client. Uses env (ODOO_BASE_URL, ODOO_API_KEY) so switching to production is done via env only.
 */

import { getOdooConfig } from "./config";

export type OdooSearchReadParams = {
  domain?: unknown[];
  fields?: string[];
  limit?: number;
  offset?: number;
  order?: string;
  context?: Record<string, unknown>;
};

export async function odooSearchRead<T = Record<string, unknown>>(
  model: string,
  params: OdooSearchReadParams = {}
): Promise<T[]> {
  const { baseUrl, apiKey, database } = getOdooConfig();
  const url = `${baseUrl}/json/2/${model}/search_read`;
  const headers: Record<string, string> = {
    "Content-Type": "application/json; charset=utf-8",
    Authorization: `bearer ${apiKey}`,
    "User-Agent": "Bestellung-App/1.0",
  };
  if (database) {
    headers["X-Odoo-Database"] = database;
  }
  const res = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify({
      domain: params.domain ?? [],
      fields: params.fields,
      limit: params.limit,
      offset: params.offset,
      order: params.order,
      context: params.context ?? {},
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Odoo API error ${res.status}: ${err}`);
  }
  return res.json() as Promise<T[]>;
}

/** Get the number of records matching the domain (real-time count from Odoo). */
export async function odooSearchCount(
  model: string,
  params: { domain?: unknown[]; context?: Record<string, unknown> } = {}
): Promise<number> {
  const { baseUrl, apiKey, database } = getOdooConfig();
  const url = `${baseUrl}/json/2/${model}/search_count`;
  const headers: Record<string, string> = {
    "Content-Type": "application/json; charset=utf-8",
    Authorization: `bearer ${apiKey}`,
    "User-Agent": "Bestellung-App/1.0",
  };
  if (database) {
    headers["X-Odoo-Database"] = database;
  }
  const res = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify({
      domain: params.domain ?? [],
      context: params.context ?? {},
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Odoo API error ${res.status}: ${err}`);
  }
  return res.json() as Promise<number>;
}
