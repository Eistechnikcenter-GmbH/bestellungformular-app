"use client";

export function LogoutButton() {
  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    // Full page navigation so the browser drops the cookie and proxy sees unauthenticated request
    window.location.href = "/login";
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      className="rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm font-medium text-stone-600 hover:bg-stone-50"
    >
      Abmelden
    </button>
  );
}
