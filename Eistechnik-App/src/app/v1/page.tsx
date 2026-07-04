import Link from "next/link";
import { AppLogo } from "@/components/AppLogo";
import { v1Modules } from "@/lib/v1-modules";

export default function V1Home() {
  return (
    <div className="min-h-screen bg-stone-100 p-4 sm:p-6 md:p-8">
      <div className="mx-auto max-w-2xl">
        <div className="mb-8 flex items-center justify-between gap-4">
          <AppLogo href="/" />
          <Link
            href="/"
            className="shrink-0 rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm font-medium text-stone-600 hover:bg-stone-50"
          >
            Version wechseln
          </Link>
        </div>

        <h1 className="mb-8 text-center text-xl font-medium text-stone-700 sm:text-2xl">
          Eistechnikcenter
        </h1>

        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6">
          {v1Modules.map(({ title, href }) => (
            <li key={href}>
              <Link
                href={href}
                prefetch={true}
                className="block rounded-xl border border-stone-300 bg-white p-6 text-center text-lg font-medium text-stone-800 shadow-sm transition hover:border-stone-400 hover:shadow"
              >
                {title}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
