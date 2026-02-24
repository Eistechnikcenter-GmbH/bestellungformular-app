"use client";

import { usePathname } from "next/navigation";
import { LogoutButton } from "./LogoutButton";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const showLogout = pathname !== "/login";

  return (
    <>
      {showLogout && (
        <div className="fixed right-4 top-4 z-10">
          <LogoutButton />
        </div>
      )}
      {children}
    </>
  );
}
