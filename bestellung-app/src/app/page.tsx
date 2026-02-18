import Link from "next/link";

const tiles = [
  { title: "Bestellformular", href: "/bestellformular" },
  { title: "CRM", href: "/crm" },
  { title: "Produkte", href: "/produkte" },
  { title: "Leads", href: "/leads" },
  { title: "Kontakte", href: "/kontakte" },
] as const;

export default function Home() {
  return (
    <div className="min-h-screen bg-stone-100 p-4 sm:p-6 md:p-8">
      <div className="mx-auto max-w-2xl">
        <h1 className="mb-8 text-center text-xl font-medium text-stone-700 sm:text-2xl">
          Eistechnikcenter
        </h1>
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6">
          {tiles.map(({ title, href }) => (
            <li key={href}>
              <Link
                href={href}
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
