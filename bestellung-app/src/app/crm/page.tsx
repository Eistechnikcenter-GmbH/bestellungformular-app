import Link from "next/link";
import { fetchCrmLeads, type CrmRow } from "@/lib/odoo-crm";
import { CrmTable } from "./CrmTable";

/** Always fetch fresh data from Odoo on every visit (no caching). */
export const dynamic = "force-dynamic";

export default async function CrmPage() {
  let rows: CrmRow[] = [];
  let error: string | null = null;
  try {
    rows = await fetchCrmLeads();
  } catch (e) {
    error = e instanceof Error ? e.message : "Unbekannter Fehler";
  }

  return (
    <div className="min-h-screen p-4 sm:p-6 md:p-8">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6 flex items-center gap-4">
          <Link
            href="/"
            className="rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50"
          >
            ← Übersicht
          </Link>
          <h1 className="text-xl font-semibold text-stone-800 sm:text-2xl">
            CRM
          </h1>
        </div>
        {error && (
          <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-800">
            {error}
          </div>
        )}
        <CrmTable rows={rows} />
      </div>
    </div>
  );
}
