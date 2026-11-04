import type { Locale } from "../../messages";

export type { Locale };

/** Content types the user can pick on the Generate screen. See content-types.ts. */
export type ContentTypeId = "auto" | "interview" | "article" | "financial";

export type InfographicContent = {
  locale: Locale;
  /** Counter behind `data-block-id`: the next id number. Only grows, so ids are never reused. */
  blockSeq: number;
  title: string;
  summary: string;
  tags: string[];
  /** HTML fragment with ig-* components (not a full document). */
  html: string;
  /** Chart specs referenced by `ig-chart` holes in `html`. */
  charts: unknown[];
  isTranslation: boolean;
};

export type ShareLink = {
  token: string;
  /** null = follow the visitor's browser language. */
  defaultLocale: Locale | null;
  /** ISO date; null = never expires. */
  expiresAt: string | null;
  revokedAt: string | null;
  createdAt: string;
};

/** What an edit changes in one locale: the html (with its block ids), the charts and the id counter. */
export type ContentSnapshot = { html: string; charts: unknown[]; blockSeq: number };

/** One successful edit (D7). `before`/`after` let undo and redo swap content without diffing. */
export type EditEntry = {
  id: string;
  instruction: string;
  scope: "global" | "block";
  blockIds: string[];
  blockNames: string[];
  createdAt: string;
  before: Partial<Record<Locale, ContentSnapshot>>;
  after: Partial<Record<Locale, ContentSnapshot>>;
};

/** Serializable summary of an entry (no snapshots) for the client. */
export type EditEntryView = Pick<EditEntry, "id" | "instruction" | "scope" | "blockIds" | "blockNames" | "createdAt">;

export type HistoryView = { entries: EditEntryView[]; cursor: number };

/** A note anchored to a block (in-memory, per infographic). */
export type MockComment = { id: string; blockId: string; text: string; createdAt: string };

export type MockInfographic = {
  id: string;
  createdAt: string;
  updatedAt: string;
  originalLocale: Locale;
  contentType: ContentTypeId;
  sourceUrl: string | null;
  sourceText: string;
  contents: Partial<Record<Locale, InfographicContent>>;
  share: ShareLink | null;
  /** Linear edit history; `historyCursor` entries are applied, the rest can be redone. */
  history?: EditEntry[];
  historyCursor?: number;
  /** Notes on blocks, oldest first. */
  comments?: MockComment[];
};

export type GenerateInput = {
  text: string;
  sourceUrl?: string;
  contentType: ContentTypeId;
};

/** Every mock action returns this shape so the UI handles real and mocked backends alike. */
export type ActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: { message: string; reference?: string } };

/** Resolved status of a share token as seen by a visitor. The UI must NOT distinguish the causes. */
export type SharedLookup =
  | { found: true; infographic: MockInfographic; link: ShareLink }
  | { found: false };
