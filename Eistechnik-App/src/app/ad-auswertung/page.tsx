import Link from "next/link";
import { V1_HOME } from "@/lib/cdn-assets";
import { AdAuswertungClient } from "./AdAuswertungClient";

export const dynamic = "force-dynamic";

export default function AdAuswertungPage() {
  return (
    <div className="min-h-screen p-4 sm:p-6 md:p-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex items-center gap-4">
          <Link
            href={V1_HOME}
            className="rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50"
          >
            ← Übersicht
          </Link>
          <h1 className="text-xl font-semibold text-stone-800 sm:text-2xl">
            Ad-Auswertung
          </h1>
        </div>
        <p className="mb-6 text-sm text-stone-600">
          Umsatz nach Marketing-Quelle — Rechnungen aus Odoo, verknüpft mit CRM-Tags oder
          Kontakt-Stichwörtern (falls kein CRM-Eintrag). AGL-Rechnungen werden über den
          Leasing-Kunden zugeordnet.
        </p>
        <AdAuswertungClient />
      </div>
    </div>
  );
}
