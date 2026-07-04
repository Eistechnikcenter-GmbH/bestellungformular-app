"use client";

import Link from "next/link";
import { LogoutButton } from "@/app/LogoutButton";
import { AppLogo } from "@/components/AppLogo";
import { NotificationBell } from "@/components/NotificationBell";

type DashboardHeaderProps = {
  showVersionSwitch?: boolean;
};

export function DashboardHeader({ showVersionSwitch = true }: DashboardHeaderProps) {
  return (
    <header className="mb-10 flex items-center justify-between gap-4 border-b border-stone-200 pb-6">
      <AppLogo />

      <div className="flex items-center gap-3 sm:gap-4">
        {showVersionSwitch && (
          <Link
            href="/"
            className="hidden rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm font-medium text-stone-600 hover:bg-stone-50 sm:inline-block"
          >
            Version wechseln
          </Link>
        )}

        <NotificationBell />

        <div className="hidden items-center gap-2 rounded-full border border-stone-200 bg-white px-3 py-1.5 sm:flex">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#9b1b4b]/10 text-sm font-semibold text-[#9b1b4b]">
            ETC
          </div>
          <span className="text-sm font-medium text-stone-700">ETC-Team</span>
        </div>

        <LogoutButton />
      </div>
    </header>
  );
}
