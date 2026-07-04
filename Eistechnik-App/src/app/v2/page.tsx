import { DashboardHeader } from "@/components/DashboardHeader";
import { ModuleTile } from "@/components/ModuleTile";
import { v2Modules } from "@/lib/v2-modules";

export default function V2Home() {
  return (
    <div className="min-h-screen bg-white px-4 py-6 sm:px-8 sm:py-8">
      <div className="mx-auto w-full max-w-[75vw] min-w-[320px]">
        <DashboardHeader />

        <main>
          <ul className="grid auto-rows-fr grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 lg:gap-5">
            {v2Modules.map((mod) => (
              <li key={mod.title} className="h-full">
                <ModuleTile
                  title={mod.title}
                  iconSrc={mod.iconSrc}
                  href={mod.href}
                  comingSoon={mod.comingSoon}
                />
              </li>
            ))}
          </ul>
        </main>
      </div>
    </div>
  );
}
