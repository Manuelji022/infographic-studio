"use client";

import { useSyncExternalStore } from "react";

/** Subscribes to a media query. Server render and first client render both report `false`. */
export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (notify) => {
      const list = window.matchMedia(query);
      list.addEventListener("change", notify);
      return () => list.removeEventListener("change", notify);
    },
    () => window.matchMedia(query).matches,
    () => false,
  );
}

/** Below 1024 px the chat is an overlay (tablet) or a bottom sheet (phone). */
export const OVERLAY_QUERY = "(max-width: 1023px)";
