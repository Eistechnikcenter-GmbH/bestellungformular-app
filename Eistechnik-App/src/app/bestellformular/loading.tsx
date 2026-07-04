import Link from "next/link";
import { V1_HOME } from "@/lib/cdn-assets";

export default function BestellformularLoading() {
  return (
    <div className="min-h-screen bg-stone-100 p-4 sm:p-6 md:p-8">
      <div className="mx-auto max-w-3xl">
        <div className="mb-6 flex items-center gap-4">
          <Link
            href={V1_HOME}
            className="rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50"
          >
            ← Übersicht
          </Link>
          <h1 className="text-xl font-semibold text-stone-800 sm:text-2xl">
            Bestellformular
          </h1>
        </div>
        <div className="rounded-xl border border-stone-300 bg-white p-8 text-center shadow-sm">
          <p className="text-stone-600">Bestellformular wird geladen…</p>
          <p className="mt-2 text-sm text-stone-400">CRM-Daten werden aus Odoo abgerufen.</p>
        </div>
      </div>
    </div>
  );
}
