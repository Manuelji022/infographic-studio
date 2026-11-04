import type { ShareLink } from "../../mocks/types";

export type LibraryCardData = {
  id: string;
  title: string;
  summary: string;
  tags: string[];
  dateLabel: string;
  languages: Array<{ code: string; label: string }>;
  shared: boolean;
  /** Active share link (revoked and expired are null), passed to the share dialog. */
  shareLink: ShareLink | null;
  /** URL of the full preview document (built on request by the preview route). */
  previewSrc: string;
};
