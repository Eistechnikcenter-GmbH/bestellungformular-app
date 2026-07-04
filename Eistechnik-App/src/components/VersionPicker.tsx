import Link from "next/link";
import { LogoutButton } from "@/app/LogoutButton";
import { AppLogo } from "@/components/AppLogo";
import { V1_HOME, V2_HOME } from "@/lib/cdn-assets";

export function VersionPicker() {
  return (
    <div className="flex min-h-screen flex-col bg-stone-50 text-stone-900">
      <header className="flex items-center justify-between px-6 py-6 sm:px-10">
        <AppLogo />
        <LogoutButton />
      </header>

      <main className="flex flex-1 flex-col items-center justify-center px-6 pb-16">
        <h1 className="mb-12 text-center text-2xl font-medium tracking-wide text-stone-800 sm:text-3xl">
          Welche Version?
        </h1>

        <div className="flex flex-col items-center gap-10 sm:flex-row sm:gap-16">
          <Link href={V1_HOME} className="group flex flex-col items-center gap-4">
            <div className="flex h-36 w-36 items-center justify-center rounded-full border-4 border-transparent bg-white text-4xl font-bold text-[#9b1b4b] shadow-md transition group-hover:border-[#9b1b4b]/40 group-hover:shadow-lg sm:h-44 sm:w-44 sm:text-5xl">
              V1
            </div>
            <span className="text-center text-lg text-stone-700 group-hover:text-stone-900">
              Version 1
              <br />
              <span className="text-sm text-stone-500">(Bestellformular)</span>
            </span>
          </Link>

          <Link href={V2_HOME} className="group flex flex-col items-center gap-4">
            <div className="flex h-36 w-36 items-center justify-center rounded-full border-4 border-transparent bg-white text-4xl font-bold text-[#9b1b4b] shadow-md transition group-hover:border-[#9b1b4b]/40 group-hover:shadow-lg sm:h-44 sm:w-44 sm:text-5xl">
              V2
            </div>
            <span className="text-center text-lg text-stone-700 group-hover:text-stone-900">
              Version 2
              <br />
              <span className="text-sm text-stone-500">(neues Tool)</span>
            </span>
          </Link>
        </div>
      </main>
    </div>
  );
}
