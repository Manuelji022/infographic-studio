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
  | "link"
  | "info"
  | "success"
  | "warning"
  | "sun"
  | "moon"
  | "monitor-cog"
  | "globe";

export const paths: Record<IconName, ReactNode> = {
  info: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5.5m0-8.5v.01" />
    </>
  ),
  success: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="m8 12.5 3 3 5-6" />
    </>
  ),
  warning: (
    <>
      <path d="M12 4 3 20h18L12 4Z" />
      <path d="M12 10v4m0 3v.01" />
    </>
  ),
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
  sun: (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2" />
      <path d="M12 20v2" />
      <path d="m4.93 4.93 1.41 1.41" />
      <path d="m17.66 17.66 1.41 1.41" />
      <path d="M2 12h2" />
      <path d="M20 12h2" />
      <path d="m6.34 17.66-1.41 1.41" />
      <path d="m19.07 4.93-1.41 1.41" />
    </>
  ),
  moon: (
    <path d="M20.985 12.486a9 9 0 1 1-9.473-9.472c.405-.022.617.46.402.803a6 6 0 0 0 8.268 8.268c.344-.215.825-.004.803.401" />
  ),
  "monitor-cog": (
    <>
      <path d="M12 17v4" />
      <path d="m14.305 7.53.923-.382" />
      <path d="m15.228 4.852-.923-.383" />
      <path d="m16.852 3.228-.383-.924" />
      <path d="m16.852 8.772-.383.923" />
      <path d="m19.148 3.228.383-.924" />
      <path d="m19.53 9.696-.382-.924" />
      <path d="m20.772 4.852.924-.383" />
      <path d="m20.772 7.148.924.383" />
      <path d="M22 13v2a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7" />
      <path d="M8 21h8" />
      <circle cx="18" cy="6" r="3" />
    </>
  ),
  globe: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18" />
      <path d="M12 3a14 14 0 0 1 0 18 14 14 0 0 1 0-18z" />
    </>
  ),
};
