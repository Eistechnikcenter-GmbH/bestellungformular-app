"use client";

import Image from "next/image";
import { CDN_NOTIFICATION_BELL } from "@/lib/cdn-assets";

export function NotificationBell() {
  return (
    <button
      type="button"
      className="flex h-10 w-10 items-center justify-center rounded-full text-stone-500 hover:bg-stone-100"
      aria-label="Benachrichtigungen"
    >
      <Image
        src={CDN_NOTIFICATION_BELL}
        alt=""
        width={22}
        height={22}
        className="h-[22px] w-[22px] object-contain"
        aria-hidden
      />
    </button>
  );
}
