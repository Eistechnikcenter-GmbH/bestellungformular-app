import Link from "next/link";

export default function LeadsPage() {
  return (
    <div className="min-h-screen p-4 sm:p-6 md:p-8">
      <div className="mx-auto max-w-2xl">
        <div className="mb-6 flex items-center gap-4">
          <Link
            href="/"
            className="rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50"
          >
            ← Übersicht
          </Link>
          <h1 className="text-xl font-semibold text-stone-800 sm:text-2xl">
            Leads
          </h1>
        </div>
        <p className="rounded-xl border border-stone-300 bg-white p-6 text-stone-600">
          Leads-Liste folgt.
        </p>
      </div>
    </div>
  );
}
