import Link from "next/link";
import { ProdukteClient } from "./ProdukteClient";

export const dynamic = "force-dynamic";

export default function ProduktePage() {
  return (
    <div className="min-h-screen bg-stone-100 p-4 sm:p-6 md:p-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6 flex items-center gap-4">
          <Link
            href="/"
            className="rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50"
          >
            ← Übersicht
          </Link>
          <h1 className="text-xl font-semibold text-stone-800 sm:text-2xl">
            Produktbibliothek
          </h1>
        </div>
        <ProdukteClient />
      </div>
    </div>
  );
}
