import type { ReactNode } from "react";

export type IconName =
  | "chevron-down"
  | "chevron-right"
  | "arrow-right"
  | "close"
  | "check"
  | "copy"
  | "share"
  | "trash"
  | "search"
  | "user"
  | "alert"
  | "link";

export const paths: Record<IconName, ReactNode> = {
  search: (
    <>
      <circle cx="11" cy="11" r="6" />
      <path d="m20 20-4.5-4.5" />
    </>
  ),
  user: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c1-4 4-6 8-6s7 2 8 6" />
    </>
  ),
  alert: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7.5v5.5m0 3v.01" />
    </>
  ),
  link: (
    <>
      <path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1" />
      <path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1" />
    </>
  ),
  "chevron-down": <path d="m6 9 6 6 6-6" />,
  "chevron-right": <path d="m9 6 6 6-6 6" />,
  "arrow-right": <path d="M4 12h16m-6-6 6 6-6 6" />,
  close: <path d="m6 6 12 12M18 6 6 18" />,
  check: <path d="m4 12 5 5L20 6" />,
  copy: (
    <>
      <rect x="8" y="8" width="12" height="12" rx="1" />
      <path d="M16 8V5H4v12h4" />
    </>
  ),
  share: (
    <>
      <path d="M12 16V4m-5 5 5-5 5 5" />
      <path d="M5 13v6h14v-6" />
    </>
  ),
  trash: (
    <>
      <path d="M4 7h16M10 11v6m4-6v6" />
      <path d="m6 7 1 13h10l1-13M9 7V4h6v3" />
    </>
  ),
};
