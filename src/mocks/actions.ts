"use server";

// Server Actions that stand in for the agent and the database (M3 replaces the bodies,
// not the signatures). Dev switches: pass `mock` = "error" | "slow" to force a state.
import { refresh } from "next/cache";
import { applyBlockInstruction } from "./edit-block.ts";
import { applyInstruction, type BlockRef } from "./edit.ts";
import { parseBlocks } from "./blocks.ts";
import {
  appendComment,
  buildFromExample,
  getInfographic,
  isLinkActive,
  jumpHistory,
  listBlockComments,
  moveHistory,
  newToken,
  pickExampleFor,
  pushEdit,
  putInfographic,
  removeInfographic,
} from "./store.ts";
import type { ActionResult, EditEntryView, GenerateInput, Locale, MockComment, ShareLink } from "./types";

export type MockFlag = "error" | "slow" | undefined;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function fail(message: string): { ok: false; error: { message: string; reference: string } } {
  return { ok: false, error: { message, reference: `mock-${Date.now().toString(36)}` } };
}

/** Simulates 6-10 s of agent work, then stores and returns a new infographic. Saved on creation (D1). */
export async function generateInfographic(
  input: GenerateInput,
  mock?: MockFlag,
): Promise<ActionResult<{ id: string }>> {
  await sleep(mock === "slow" ? 20_000 : 6_000 + Math.random() * 4_000);
  if (mock === "error") return fail("generation_failed");
  if (!input.text.trim()) return fail("empty_text");
  const id = `gen-${crypto.randomUUID().slice(0, 8)}`;
  putInfographic(
    buildFromExample(id, pickExampleFor(input.contentType, input.text), {
      contentType: input.contentType,
      sourceUrl: input.sourceUrl?.trim() || null,
      sourceText: input.text,
    }),
  );
  return { ok: true, data: { id } };
}

export async function deleteInfographic(id: string): Promise<ActionResult<null>> {
  await sleep(300);
  return removeInfographic(id) ? { ok: true, data: null } : fail("not_found");
}

export async function createShareLink(
  id: string,
  options: { defaultLocale: Locale | null; expiresInDays: 7 | 30 | null },
): Promise<ActionResult<ShareLink>> {
  await sleep(300);
  const infographic = getInfographic(id);
  if (!infographic) return fail("not_found");
  const link: ShareLink = {
    token: newToken(),
    defaultLocale: options.defaultLocale,
    expiresAt: options.expiresInDays
      ? new Date(Date.now() + options.expiresInDays * 86_400_000).toISOString()
      : null,
    revokedAt: null,
    createdAt: new Date().toISOString(),
  };
  putInfographic({ ...infographic, share: link });
  return { ok: true, data: link };
}

export async function revokeShareLink(id: string): Promise<ActionResult<null>> {
  await sleep(300);
  const infographic = getInfographic(id);
  if (!infographic?.share) return fail("not_found");
  putInfographic({
    ...infographic,
    share: { ...infographic.share, revokedAt: new Date().toISOString() },
  });
  return { ok: true, data: null };
}

/**
 * Changes the language and/or expiry of an active link and keeps its token, so links already
 * shared keep working. `expiresInDays: undefined` keeps the current expiry clock.
 */
export async function updateShareLink(
  id: string,
  options: { defaultLocale: Locale | null; expiresInDays?: 7 | 30 | null },
): Promise<ActionResult<ShareLink>> {
  await sleep(300);
  if (options.defaultLocale !== null && !isLocale(options.defaultLocale)) return fail("invalid_locale");
  const infographic = getInfographic(id);
  const current = infographic?.share ?? null;
  // Revoked or expired links cannot be revived: the owner must create a new one.
  if (!infographic || !current || !isLinkActive(current)) return fail("not_found");
  const expiresAt =
    options.expiresInDays === undefined
      ? current.expiresAt
      : options.expiresInDays
        ? new Date(Date.now() + options.expiresInDays * 86_400_000).toISOString()
        : null;
  const link: ShareLink = { ...current, defaultLocale: options.defaultLocale, expiresAt };
  putInfographic({ ...infographic, share: link });
  return { ok: true, data: link };
}

const TITLE_MIN = 1;
const TITLE_MAX = 160;

function isLocale(value: unknown): value is Locale {
  return value === "es" || value === "en";
}

/** Server-side checks: locale must be es/en, title a string of 1..160 characters once trimmed. */
export async function renameInfographic(
  id: string,
  locale: Locale,
  title: string,
): Promise<ActionResult<null>> {
  if (!isLocale(locale)) return fail("invalid_locale");
  if (typeof title !== "string") return fail("invalid_title");
  const trimmed = title.trim();
  if (trimmed.length < TITLE_MIN || trimmed.length > TITLE_MAX) return fail("invalid_title");
  const infographic = getInfographic(id);
  const content = infographic?.contents[locale];
  if (!infographic || !content) return fail("not_found");
  putInfographic({
    ...infographic,
    updatedAt: new Date().toISOString(),
    contents: { ...infographic.contents, [locale]: { ...content, title: trimmed } },
  });
  return { ok: true, data: null };
}

export type EditGlobalData =
  | { notPossible?: false; entry: EditEntryView; changedBlocks: BlockRef[] }
  | { notPossible: true; reason: string };

/**
 * Simulates the agent applying a conversational instruction to the whole infographic (1.5-3 s).
 * Only the locale being viewed changes. `mock` = "error" fails, "slow" waits much longer.
 */
export async function editGlobal(
  id: string,
  locale: Locale,
  instruction: string,
  mock?: MockFlag,
): Promise<ActionResult<EditGlobalData>> {
  await sleep(mock === "slow" ? 12_000 : 1_500 + Math.random() * 1_500);
  if (mock === "error") return fail("edit_failed");
  if (!isLocale(locale) || typeof instruction !== "string" || !instruction.trim()) return fail("invalid_instruction");
  const infographic = getInfographic(id);
  const content = infographic?.contents[locale];
  if (!infographic || !content) return fail("not_found");

  const outcome = applyInstruction(content.html, instruction, content.charts, content.blockSeq);
  if (outcome.kind === "notPossible") return { ok: true, data: { notPossible: true, reason: outcome.reason } };

  const snapshot = { html: content.html, charts: content.charts, blockSeq: content.blockSeq };
  const entry = {
    id: `edit-${crypto.randomUUID().slice(0, 8)}`,
    instruction: instruction.trim(),
    scope: "global" as const,
    blockIds: outcome.changedBlocks.map((block) => block.id),
    blockNames: outcome.changedBlocks.map((block) => block.name),
    createdAt: new Date().toISOString(),
    before: { [locale]: snapshot },
    after: { [locale]: { html: outcome.html, charts: content.charts, blockSeq: outcome.blockSeq } },
  };
  pushEdit(id, entry);
  refresh();
  const { id: entryId, instruction: text, scope, blockIds, blockNames, createdAt } = entry;
  return {
    ok: true,
    data: {
      entry: { id: entryId, instruction: text, scope, blockIds, blockNames, createdAt },
      changedBlocks: outcome.changedBlocks,
    },
  };
}

export type EditBlockOptions = {
  /** Regenerate: rerun `instruction` (may be empty); if that changes nothing, make a neutral variant. */
  regenerate?: boolean;
};

/**
 * Simulates the agent applying an instruction to ONE block (1.5-3 s). Every other block and
 * every other chart spec stays byte-identical; the edited block keeps its id. The change is
 * recorded as a `block` history entry, so undo/redo work like for global edits.
 */
export async function editBlock(
  id: string,
  locale: Locale,
  blockId: string,
  instruction: string,
  mock?: MockFlag,
  options: EditBlockOptions = {},
): Promise<ActionResult<EditGlobalData>> {
  await sleep(mock === "slow" ? 12_000 : 1_500 + Math.random() * 1_500);
  if (mock === "error") return fail("edit_failed");
  const text = typeof instruction === "string" ? instruction.trim() : "";
  if (!isLocale(locale) || typeof blockId !== "string" || !blockId) return fail("invalid_instruction");
  if (!text && !options.regenerate) return fail("invalid_instruction");
  const infographic = getInfographic(id);
  const content = infographic?.contents[locale];
  if (!infographic || !content) return fail("not_found");

  let outcome = text
    ? applyBlockInstruction(content.html, content.charts, content.blockSeq, blockId, text)
    : ({ kind: "notPossible", reason: "no-change" } as const);
  if (options.regenerate && outcome.kind === "notPossible" && (outcome.reason === "no-change" || !text)) {
    outcome = applyBlockInstruction(content.html, content.charts, content.blockSeq, blockId, "", { variant: true });
  }
  if (outcome.kind === "notPossible") return { ok: true, data: { notPossible: true, reason: outcome.reason } };

  const entry = {
    id: `edit-${crypto.randomUUID().slice(0, 8)}`,
    instruction: text || "regenerate",
    scope: "block" as const,
    blockIds: [outcome.block.id],
    blockNames: [outcome.block.name],
    createdAt: new Date().toISOString(),
    before: { [locale]: { html: content.html, charts: content.charts, blockSeq: content.blockSeq } },
    after: { [locale]: { html: outcome.html, charts: outcome.charts, blockSeq: outcome.blockSeq } },
  };
  pushEdit(id, entry);
  refresh();
  const { id: entryId, instruction: said, scope, blockIds, blockNames, createdAt } = entry;
  return {
    ok: true,
    data: {
      entry: { id: entryId, instruction: said, scope, blockIds, blockNames, createdAt },
      changedBlocks: [outcome.block],
    },
  };
}

const COMMENT_MAX = 1000;

/** Stores a note on a block of this infographic (in memory). */
export async function addComment(id: string, blockId: string, text: string): Promise<ActionResult<MockComment>> {
  await sleep(200);
  if (typeof text !== "string" || typeof blockId !== "string") return fail("invalid_comment");
  const trimmed = text.trim();
  if (!trimmed || trimmed.length > COMMENT_MAX) return fail("invalid_comment");
  const infographic = getInfographic(id);
  if (!infographic) return fail("not_found");
  const known = Object.values(infographic.contents).some(
    (content) => content && parseBlocks(content.html, { charts: content.charts }).some((block) => block.id === blockId),
  );
  if (!known) return fail("not_found");
  const comment: MockComment = {
    id: `c-${crypto.randomUUID().slice(0, 8)}`,
    blockId,
    text: trimmed,
    createdAt: new Date().toISOString(),
  };
  appendComment(id, comment);
  return { ok: true, data: comment };
}

export async function listComments(id: string): Promise<ActionResult<MockComment[]>> {
  if (!getInfographic(id)) return fail("not_found");
  return { ok: true, data: listBlockComments(id) };
}

async function moveEdit(id: string, entryId: string, direction: "undo" | "redo"): Promise<ActionResult<null>> {
  await sleep(300);
  if (!moveHistory(id, entryId, direction)) return fail("not_found");
  refresh();
  return { ok: true, data: null };
}

/** Reverts the latest applied edit. */
export async function undoEdit(id: string, entryId: string): Promise<ActionResult<null>> {
  return moveEdit(id, entryId, "undo");
}

/** Re-applies the next undone edit. */
export async function redoEdit(id: string, entryId: string): Promise<ActionResult<null>> {
  return moveEdit(id, entryId, "redo");
}

/**
 * Moves the history cursor to just after `entryId`, or back to the original version when
 * `entryId` is null. Later entries stay in the list and can be redone.
 */
export async function restoreToEntry(id: string, entryId: string | null): Promise<ActionResult<null>> {
  await sleep(300);
  const infographic = getInfographic(id);
  if (!infographic) return fail("not_found");
  const index = entryId === null ? -1 : (infographic.history ?? []).findIndex((entry) => entry.id === entryId);
  if (entryId !== null && index < 0) return fail("not_found");
  if (!jumpHistory(id, index + 1)) return fail("not_found");
  refresh();
  return { ok: true, data: null };
}
