import type { ReactNode } from "react";

export type IconName =
  | "chevron-down"
  | "chevron-right"
  | "arrow-right"
  | "close"
  | "check"
  | "copy"
  | "share"
  | "trash";

export const paths: Record<IconName, ReactNode> = {
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
