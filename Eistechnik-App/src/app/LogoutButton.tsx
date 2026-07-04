"use client";

type LogoutButtonProps = {
  variant?: "light" | "dark";
};

export function LogoutButton({ variant = "light" }: LogoutButtonProps) {
  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    window.location.href = "/login";
  }

  const classes =
    variant === "dark"
      ? "rounded border border-stone-500 bg-transparent px-4 py-2 text-sm font-medium text-stone-300 hover:border-white hover:text-white"
      : "rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm font-medium text-stone-600 hover:bg-stone-50";

  return (
    <button type="button" onClick={handleLogout} className={classes}>
      Abmelden
    </button>
  );
}
