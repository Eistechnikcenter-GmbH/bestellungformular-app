import Link from "next/link";
import { fetchCrmLeads, type CrmRow } from "@/lib/odoo-crm";
import { OrderForm } from "./OrderForm";

export const dynamic = "force-dynamic";

export default async function BestellformularPage() {
  let leads: CrmRow[] = [];
  let error: string | null = null;
  try {
    leads = await fetchCrmLeads();
  } catch (e) {
    error = e instanceof Error ? e.message : "Fehler beim Laden der CRM-Daten";
  }

  return (
    <div className="min-h-screen bg-stone-100 p-4 sm:p-6 md:p-8">
      <div className="mx-auto max-w-3xl">
        <div className="mb-6 flex items-center gap-4">
          <Link
            href="/"
            className="rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50"
          >
            ← Übersicht
          </Link>
          <h1 className="text-xl font-semibold text-stone-800 sm:text-2xl">
            Bestellformular
          </h1>
        </div>

        <div className="mb-4 w-full overflow-hidden rounded-t-xl">
          <img
            src="/images/bestellung-header.svg"
            alt=""
            className="h-auto w-full object-cover object-left"
          />
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            {error}
          </div>
        )}

        <OrderForm leads={leads} />

        <div className="mt-6 w-full overflow-hidden rounded-b-xl">
          <img
            src="/images/bestellung-footer.svg"
            alt=""
            className="h-auto w-full object-cover object-left"
          />
        </div>
      </div>
    </div>
  );
}
