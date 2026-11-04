"use client";

import { useCallback, useEffect, useId, useMemo, useRef, useState, useTransition, type RefObject } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button, ConfirmDialog, Dialog, Icon, Input, Note, Text } from "@ds/ui";
import { getMessages, type Locale } from "../../../messages";
import { addComment, deleteInfographic, redoEdit, renameInfographic, restoreToEntry, undoEdit, type MockFlag } from "../../mocks/actions";
import { HistoryPanel } from "../history/HistoryPanel";
import type { HistoryView, ShareLink } from "../../mocks/types";
import { BlockLayer } from "../blocks/BlockLayer";
import type { BlockComment, BlockInfo } from "../blocks/types";
import { ChatPanel } from "../chat/ChatPanel";
import { OVERLAY_QUERY, useMediaQuery } from "../chat/use-media-query";
import { runChatRequest } from "../chat/run-request";
import type { ChatRequest, SelectedBlock } from "../chat/types";
import { useChat } from "../chat/useChat";
import { ShareController } from "../share/ShareController";
import { InfographicFrame, type FrameTheme, type InfographicFrameHandle } from "./InfographicFrame";
import { WorkspaceShell } from "./WorkspaceShell";
import { ChatIcon, RedoIcon, UndoIcon } from "./workspace-icons";
import styles from "./WorkspaceView.module.css";

export type WorkspaceViewProps = {
  id: string;
  locale: Locale;
  /** Locale of the content actually shown (differs from `locale` when it is missing). */
  contentLocale: Locale;
  missingLocale: boolean;
  title: string;
  srcDoc: string;
  sourceText: string;
  link: ShareLink | null;
  /** Applied and undone edits of this infographic (D7). */
  history: HistoryView;
  /** Dev switch forwarded to the mock agent: force an error or a slow answer. */
  mock?: MockFlag;
  /** Blocks of the document (ids come from `data-block-id`), in document order. */
  blocks: BlockInfo[];
  /** Notes saved on blocks of this infographic. */
  comments: BlockComment[];
  /** Block already selected on load (U6 drives selection from the document; used by previews). */
  initialSelectedBlock?: SelectedBlock | null;
};

const CHAT_KEY = "studio.chat.open";
const CHAT_PANEL_ID = "workspace-chat";
/** Phones, tablets and coarse pointers: tap selects and the actions live in a bottom bar. */
const TOUCH_QUERY = "(max-width: 1024px), (pointer: coarse)";
const UPDATED_MS = 1200;
function isTextField(target: EventTarget | null): boolean {
  return target instanceof HTMLElement && (target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName));
}

export function WorkspaceView(props: WorkspaceViewProps) {
  const { id, locale, contentLocale, missingLocale, srcDoc, sourceText, link, history, mock } = props;
  const messages = getMessages(locale);
  const router = useRouter();
  const [theme, setTheme] = useState<FrameTheme>("auto");
  const [shareOpen, setShareOpen] = useState(false);
  const [sourceOpen, setSourceOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyNotice, setHistoryNotice] = useState("");
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, startDelete] = useTransition();
  const [deleteFailed, setDeleteFailed] = useState(false);
  const [copied, setCopied] = useState(false);
  const [copyFailed, setCopyFailed] = useState(false);
  const moreRef = useRef<HTMLButtonElement>(null);
  const chatToggleRef = useRef<HTMLButtonElement>(null);
  const frameRef = useRef<InfographicFrameHandle>(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatFocus, setChatFocus] = useState(false);
  const [selectedBlock, setSelectedBlock] = useState<SelectedBlock | null>(props.initialSelectedBlock ?? null);
  const [historyPending, startHistory] = useTransition();
  const overlay = useMediaQuery(OVERLAY_QUERY);
  const touchMode = useMediaQuery(TOUCH_QUERY);
  const [comments, setComments] = useState<BlockComment[]>(props.comments);
  const [commentOpenId, setCommentOpenId] = useState<string | null>(null);
  const [workingId, setWorkingId] = useState<string | null>(null);
  const [updated, setUpdated] = useState<{ id: string; stamp: number } | null>(null);
  const updatedTimer = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(updatedTimer.current), []);
  // Overlay mode makes the page behind inert while the chat is open (dialog semantics).
  const behindInert = overlay && chatOpen;

  // Desktop opens the chat the first time; after that the saved preference wins.
  useEffect(() => {
    let saved: string | null = null;
    try {
      saved = window.localStorage.getItem(CHAT_KEY);
    } catch {
      // Storage can be blocked: fall back to the default.
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reads a browser-only preference after hydration
    setChatOpen(saved ? saved === "open" : window.matchMedia("(min-width: 1024px)").matches);
  }, []);

  function setChat(open: boolean, focusInput = false) {
    setChatOpen(open);
    setChatFocus(open && focusInput);
    try {
      window.localStorage.setItem(CHAT_KEY, open ? "open" : "closed");
    } catch {
      // Not persisted; the panel still works.
    }
    if (!open) window.setTimeout(() => chatToggleRef.current?.focus(), 0);
  }

  const run = useCallback(
    async (request: ChatRequest) => {
      const blockId = request.block?.id ?? null;
      if (blockId) setWorkingId(blockId);
      const outcome = await runChatRequest({ id, locale: contentLocale, mock }, request);
      setWorkingId(null);
      if (blockId && outcome.type === "done") {
        setUpdated({ id: blockId, stamp: Date.now() });
        window.clearTimeout(updatedTimer.current);
        updatedTimer.current = window.setTimeout(() => setUpdated(null), UPDATED_MS);
      }
      return outcome;
    },
    [id, contentLocale, mock],
  );
  const chat = useChat(run);

  const { entries, cursor } = history;
  const undoEntryId = cursor > 0 ? entries[cursor - 1].id : null;
  const redoEntryId = cursor < entries.length ? entries[cursor].id : null;
  // The newest reply can finish before the server sends the history that records its edit (the
  // action refreshes the page right after). Until then that edit counts as applied, not undone.
  const latestDoneEntryId = useMemo(() => {
    for (let i = chat.messages.length - 1; i >= 0; i--) {
      const message = chat.messages[i];
      if (message.role === "assistant" && message.status === "done") return message.entryId;
    }
    return null;
  }, [chat.messages]);
  const appliedEntryIds = useMemo(() => {
    const applied = new Set(entries.slice(0, cursor).map((entry) => entry.id));
    if (latestDoneEntryId && !entries.some((entry) => entry.id === latestDoneEntryId)) applied.add(latestDoneEntryId);
    return applied;
  }, [entries, cursor, latestDoneEntryId]);
  const editing = chat.busy || historyPending;
  const canUndo = undoEntryId !== null && !editing;
  const canRedo = redoEntryId !== null && !editing;

  // The latest applied edit, when it was a single-block one: its block offers Undo in its toolbar.
  const lastEntry = cursor > 0 ? entries[cursor - 1] : null;
  const undoBlockId = lastEntry?.scope === "block" ? (lastEntry.blockIds[0] ?? null) : null;

  const blockById = useMemo(() => new Map(props.blocks.map((block) => [block.id, block])), [props.blocks]);
  const asSelected = useCallback(
    (blockId: string): SelectedBlock | null => {
      const block = blockById.get(blockId);
      return block ? { id: block.id, name: block.name, type: block.type } : null;
    },
    [blockById],
  );
  // A selection whose block no longer exists (e.g. after an undo of a structural change) is dropped.
  const selection = selectedBlock && blockById.has(selectedBlock.id) ? selectedBlock : null;
  const commentCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const comment of comments) counts[comment.blockId] = (counts[comment.blockId] ?? 0) + 1;
    return counts;
  }, [comments]);

  function selectBlock(blockId: string | null) {
    setSelectedBlock(blockId ? asSelected(blockId) : null);
    if (!blockId) setCommentOpenId(null);
  }

  function focusChatInput() {
    window.setTimeout(() => document.querySelector<HTMLTextAreaElement>(`#${CHAT_PANEL_ID} textarea`)?.focus(), 60);
  }

  function editWithAi(blockId: string) {
    selectBlock(blockId);
    setChat(true, true);
    focusChatInput();
  }

  function regenerate(blockId: string) {
    const block = asSelected(blockId);
    if (!block || editing) return;
    selectBlock(blockId);
    const last = [...entries.slice(0, cursor)]
      .reverse()
      .find((entry) => entry.scope === "block" && entry.blockIds.includes(blockId) && entry.instruction !== "regenerate");
    chat.send({ instruction: messages.blockActionRegenerate, block, regenerate: { rerun: last?.instruction ?? null } });
  }

  async function saveNote(blockId: string, text: string): Promise<boolean> {
    try {
      const result = await addComment(id, blockId, text);
      if (!result.ok) return false;
      setComments((current) => [...current, result.data]);
      setCommentOpenId(null);
      window.setTimeout(() => document.querySelector<HTMLElement>('[data-action="comment"]')?.focus(), 0);
      return true;
    } catch {
      return false;
    }
  }

  function askAi(blockId: string, text: string) {
    const block = asSelected(blockId);
    if (!block) return;
    setCommentOpenId(null);
    if (!overlay) setChat(true, false);
    chat.send({ instruction: text, block });
  }

  function undo(entryId: string | null = undoEntryId) {
    if (!entryId || editing) return;
    startHistory(async () => {
      await undoEdit(id, entryId);
    });
  }

  function redo() {
    if (!redoEntryId || editing) return;
    const entryId = redoEntryId;
    startHistory(async () => {
      await redoEdit(id, entryId);
    });
  }

  /** Jumps the cursor to `entryId` (null = original). Later entries stay redoable. */
  function restore(entryId: string | null) {
    if (editing) return;
    setHistoryNotice("");
    startHistory(async () => {
      try {
        const result = await restoreToEntry(id, entryId);
        setHistoryNotice(result.ok ? messages.historyRestored : messages.genericError);
      } catch {
        setHistoryNotice(messages.genericError);
      }
    });
  }

  // Cmd/Ctrl+Z and Shift+Z, unless the user is typing.
  const shortcut = useRef({ undo, redo, canUndo, canRedo });
  useEffect(() => {
    shortcut.current = { undo, redo, canUndo, canRedo };
  });
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (!(event.metaKey || event.ctrlKey) || event.altKey || event.key.toLowerCase() !== "z") return;
      if (isTextField(event.target)) return;
      const current = shortcut.current;
      if (event.shiftKey ? current.canRedo : current.canUndo) {
        event.preventDefault();
        if (event.shiftKey) current.redo();
        else current.undo();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  // Esc deselects; a press on empty canvas does too (clicks inside the iframe are handled by BlockLayer).
  const escState = useRef({ commentOpen: false, chatModal: false, selected: false });
  useEffect(() => {
    escState.current = { commentOpen: commentOpenId !== null, chatModal: overlay && chatOpen, selected: selection !== null };
  });
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const state = escState.current;
      if (event.key !== "Escape" || event.defaultPrevented || !state.selected || state.commentOpen || state.chatModal) return;
      if (document.querySelector("dialog[open]")) return;
      setSelectedBlock(null);
    };
    const onPointerDown = (event: PointerEvent) => {
      if (!escState.current.selected || !(event.target instanceof Element)) return;
      const ui = "iframe, [data-block-layer], [data-block-nav], [role=dialog], dialog, aside, header, button, a, input, textarea, select, [role=toolbar], [role=menu]";
      if (!event.target.closest(ui)) setSelectedBlock(null);
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("pointerdown", onPointerDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("pointerdown", onPointerDown);
    };
  }, []);

  useEffect(() => {
    if (!copied) return;
    const timeout = window.setTimeout(() => setCopied(false), 2000);
    return () => window.clearTimeout(timeout);
  }, [copied]);

  /** Closing a dialog opened from the menu returns focus to the More trigger (UI_EXPERIENCE §6). */
  const returnFocus = () => {
    window.setTimeout(() => moreRef.current?.focus(), 0);
  };

  const documentUrl = (extra: string) =>
    `/i/${id}/download?locale=${contentLocale}&theme=${theme}${extra}`;

  async function copyHtml() {
    setCopied(false);
    setCopyFailed(false);
    try {
      const response = await fetch(documentUrl("&inline=1"));
      if (!response.ok) throw new Error("download failed");
      await navigator.clipboard.writeText(await response.text());
      setCopied(true);
    } catch {
      setCopyFailed(true);
    }
  }

  function remove() {
    setDeleteFailed(false);
    startDelete(async () => {
      try {
        const result = await deleteInfographic(id);
        if (result.ok) {
          router.push("/library?deleted=1");
          return;
        }
      } catch {
        // Handled below: the dialog stays open so the user can retry.
      }
      setDeleteFailed(true);
    });
  }

  const bar = (
    <header className={styles.bar} inert={behindInert}>
      <Link href="/library" className={styles.back} aria-label={messages.workspaceBack}>
        <Icon name="chevron-right" className={styles.backIcon} />
        <span className={styles.hideNarrow}>{messages.workspaceBack}</span>
      </Link>
      <TitleEditor id={id} locale={contentLocale} title={props.title} messages={messages} />
      <div className={styles.actions}>
        <button
          type="button"
          className={`${styles.trigger} ${styles.secondary}`}
          aria-label={messages.historyUndo}
          title={messages.historyUndo}
          disabled={!canUndo}
          onClick={() => undo()}
        >
          <UndoIcon />
        </button>
        <button
          type="button"
          className={`${styles.trigger} ${styles.secondary}`}
          aria-label={messages.historyRedo}
          title={messages.historyRedo}
          disabled={!canRedo}
          onClick={redo}
        >
          <RedoIcon />
        </button>
        <Button variant="outline" size="sm" aria-label={messages.workspaceShare} onClick={() => setShareOpen(true)}>
          <Icon name="share" />
          <span className={styles.hideNarrow}>{messages.workspaceShare}</span>
        </Button>
        <MoreMenu
          messages={messages}
          triggerRef={moreRef}
          theme={theme}
          onTheme={setTheme}
          downloadHref={documentUrl("")}
          copied={copied}
          copyFailed={copyFailed}
          onCopy={copyHtml}
          onSource={() => setSourceOpen(true)}
          onHistory={() => {
            setHistoryNotice("");
            setHistoryOpen(true);
          }}
          onDelete={() => {
            setDeleteFailed(false);
            setDeleteOpen(true);
          }}
          canUndo={canUndo}
          canRedo={canRedo}
          onUndo={() => undo()}
          onRedo={redo}
        />
        <button
          ref={chatToggleRef}
          type="button"
          className={styles.trigger}
          aria-label={chatOpen ? messages.chatClose : messages.chatOpen}
          title={chatOpen ? messages.chatClose : messages.chatOpen}
          aria-expanded={chatOpen}
          aria-controls={CHAT_PANEL_ID}
          onClick={() => setChat(!chatOpen, true)}
        >
          <ChatIcon />
        </button>
      </div>
      {editing ? <div className={styles.progress} aria-hidden="true" /> : null}
    </header>
  );

  return (
    <WorkspaceShell
      bar={bar}
      asideId={CHAT_PANEL_ID}
      asideOpen={chatOpen}
      overlay={overlay}
      onAsideDismiss={() => setChat(false)}
      aside={
        <ChatPanel
          messages={messages}
          conversation={chat.messages}
          busy={editing}
          appliedEntryIds={appliedEntryIds}
          undoEntryId={undoEntryId}
          selectedBlock={selection}
          comments={selection ? comments.filter((comment) => comment.blockId === selection.id) : []}
          focusOnSelect={!touchMode}
          autoFocus={chatFocus}
          overlay={overlay}
          onClearSelection={() => selectBlock(null)}
          onSend={(instruction) => chat.send({ instruction, block: selection })}
          onRetry={chat.retry}
          onUndo={undo}
          onHighlightBlock={(blockId) => {
            selectBlock(blockId);
            frameRef.current?.scrollToBlock(blockId);
          }}
          onClose={() => setChat(false)}
        />
      }
    >
      <div className={styles.stage} style={touchMode && selection ? { paddingBottom: "7rem" } : undefined}>
        {missingLocale ? (
          <Note
            variant="warning"
            action={
              <Button variant="outline" size="sm" disabled aria-disabled="true">
                {messages.workspaceTranslate}
              </Button>
            }
          >
            {messages.workspaceMissingLocale}
          </Note>
        ) : null}
        <InfographicFrame
          srcDoc={srcDoc}
          title={props.title}
          theme={theme}
          loading={messages.workspaceLoading}
          handle={frameRef}
        >
          <BlockLayer
            messages={messages}
            blocks={props.blocks}
            selectedId={selection?.id ?? null}
            touchMode={touchMode}
            barHidden={behindInert}
            workingId={workingId}
            updated={updated}
            commentCounts={commentCounts}
            busy={editing}
            undoBlockId={undoBlockId}
            commentOpenId={commentOpenId}
            navLabel={messages.blockListLabel}
            onSelect={selectBlock}
            onReveal={(blockId) => frameRef.current?.scrollToBlock(blockId)}
            onComment={(blockId) => {
              selectBlock(blockId);
              setCommentOpenId(blockId);
            }}
            onEdit={editWithAi}
            onRegenerate={regenerate}
            onUndo={() => undo()}
            onCloseComment={() => {
              setCommentOpenId(null);
              window.setTimeout(() => document.querySelector<HTMLElement>('[data-action="comment"]')?.focus(), 0);
            }}
            onSaveNote={saveNote}
            onAskAi={askAi}
          />
        </InfographicFrame>
      </div>
      <HistoryPanel
        open={historyOpen}
        onClose={() => {
          setHistoryOpen(false);
          returnFocus();
        }}
        messages={messages}
        locale={locale}
        history={history}
        busy={editing}
        notice={historyNotice}
        onRestore={restore}
      />
      <ShareController
        infographicId={id}
        link={link}
        locale={locale}
        open={shareOpen}
        onClose={() => setShareOpen(false)}
      />
      <Dialog
        open={sourceOpen}
        onClose={() => {
          setSourceOpen(false);
          returnFocus();
        }}
        title={messages.workspaceSourceTextTitle}
        footer={
          <Button variant="ivory" onClick={() => { setSourceOpen(false); returnFocus(); }}>
            {messages.workspaceClose}
          </Button>
        }
      >
        <Text className={styles.source}>{sourceText}</Text>
      </Dialog>
      <ConfirmDialog
        open={deleteOpen}
        onClose={() => {
          setDeleteOpen(false);
          returnFocus();
        }}
        onConfirm={remove}
        title={messages.deleteTitle}
        description={
          <>
            {messages.deleteBody}
            {deleteFailed ? (
              <Note variant="error" role="alert" className={styles.noteGap}>
                {messages.genericError}
              </Note>
            ) : null}
          </>
        }
        confirmLabel={deleteFailed ? messages.retry : messages.deleteConfirm}
        cancelLabel={messages.deleteCancel}
        status={deleting ? "pending" : "idle"}
      />
    </WorkspaceShell>
  );
}

function TitleEditor({
  id,
  locale,
  title,
  messages,
}: {
  id: string;
  locale: Locale;
  title: string;
  messages: ReturnType<typeof getMessages>;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(title);
  const [pending, startSave] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);
  const editRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (editing) inputRef.current?.select();
  }, [editing]);

  function finish(save: boolean) {
    setEditing(false);
    const next = draft.trim();
    if (!save || !next || next === title) {
      setDraft(title);
    } else {
      startSave(async () => {
        const result = await renameInfographic(id, locale, next);
        if (result.ok) router.refresh();
        else setDraft(title);
      });
    }
    window.setTimeout(() => editRef.current?.focus(), 0);
  }

  if (editing) {
    return (
      <form
        className={styles.titleForm}
        onSubmit={(event) => {
          event.preventDefault();
          finish(true);
        }}
      >
        <Input
          ref={inputRef}
          aria-label={messages.workspaceTitleLabel}
          value={draft}
          maxLength={160}
          onChange={(event) => setDraft(event.target.value)}
          onBlur={() => finish(true)}
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              event.preventDefault();
              finish(false);
            }
          }}
        />
        <button type="submit" className={styles.srOnly}>{messages.workspaceTitleSave}</button>
      </form>
    );
  }

  const shown = pending ? draft : title;
  return (
    <button
      ref={editRef}
      type="button"
      className={styles.titleButton}
      aria-label={`${messages.workspaceTitleLabel}: ${shown}`}
      title={shown}
      onClick={() => {
        setDraft(title);
        setEditing(true);
      }}
    >
      <span className={styles.titleText}>{shown}</span>
    </button>
  );
}

function MoreMenu({
  messages,
  triggerRef,
  theme,
  onTheme,
  downloadHref,
  copied,
  copyFailed,
  onCopy,
  onSource,
  onHistory,
  onDelete,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
}: {
  messages: ReturnType<typeof getMessages>;
  triggerRef: RefObject<HTMLButtonElement | null>;
  theme: FrameTheme;
  onTheme: (theme: FrameTheme) => void;
  downloadHref: string;
  copied: boolean;
  copyFailed: boolean;
  onCopy: () => void;
  onSource: () => void;
  onHistory: () => void;
  onDelete: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const listId = useId();

  useEffect(() => {
    if (!open) return;
    const onPointer = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onFocusOut = (event: FocusEvent) => {
      if (event.relatedTarget && !rootRef.current?.contains(event.relatedTarget as Node)) setOpen(false);
    };
    const root = rootRef.current;
    document.addEventListener("pointerdown", onPointer);
    root?.addEventListener("focusout", onFocusOut);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      root?.removeEventListener("focusout", onFocusOut);
    };
  }, [open]);

  useEffect(() => {
    if (open) rootRef.current?.querySelector<HTMLElement>("[data-item]:not(:disabled)")?.focus();
  }, [open]);

  const close = (refocus: boolean) => {
    setOpen(false);
    if (refocus) triggerRef.current?.focus();
  };

  const moveFocus = (delta: number) => {
    const items = [...(rootRef.current?.querySelectorAll<HTMLElement>("[data-item]:not(:disabled)") ?? [])];
    const index = items.indexOf(document.activeElement as HTMLElement);
    items[(index + delta + items.length) % items.length]?.focus();
  };

  const themes: Array<{ value: FrameTheme; label: string }> = [
    { value: "light", label: messages.workspaceThemeLight },
    { value: "dark", label: messages.workspaceThemeDark },
    { value: "auto", label: messages.workspaceThemeAuto },
  ];

  return (
    <div
      ref={rootRef}
      className={styles.menu}
      onKeyDown={(event) => {
        if (event.key === "Escape" && open) {
          event.stopPropagation();
          close(true);
        } else if (open && event.key === "ArrowDown") {
          event.preventDefault();
          moveFocus(1);
        } else if (open && event.key === "ArrowUp") {
          event.preventDefault();
          moveFocus(-1);
        }
      }}
    >
      <button
        ref={triggerRef}
        type="button"
        className={styles.trigger}
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        aria-label={messages.workspaceMoreMenu}
        onClick={() => setOpen((value) => !value)}
      >
        <svg viewBox="0 0 24 24" className={styles.dots} aria-hidden="true" focusable="false">
          <circle cx="5" cy="12" r="1.6" />
          <circle cx="12" cy="12" r="1.6" />
          <circle cx="19" cy="12" r="1.6" />
        </svg>
      </button>
      {open ? (
        <div id={listId} className={styles.list}>
          <a data-item className={styles.item} href={downloadHref} download onClick={() => close(false)}>
            {messages.workspaceDownload}
          </a>
          <button
            type="button"
            data-item
            className={`${styles.item} ${styles.narrowOnly}`}
            disabled={!canUndo}
            onClick={() => {
              close(false);
              onUndo();
            }}
          >
            <UndoIcon />
            {messages.historyUndo}
          </button>
          <button
            type="button"
            data-item
            className={`${styles.item} ${styles.narrowOnly}`}
            disabled={!canRedo}
            onClick={() => {
              close(false);
              onRedo();
            }}
          >
            <RedoIcon />
            {messages.historyRedo}
          </button>
          <button type="button" data-item className={styles.item} onClick={onCopy}>
            <Icon name={copied ? "check" : "copy"} />
            {copied ? messages.workspaceCopied : messages.workspaceCopyHtml}
          </button>
          {copyFailed ? (
            <Text role="alert" variant="caption" className={styles.menuError}>
              {messages.genericError}
            </Text>
          ) : null}
          <button
            type="button"
            data-item
            className={styles.item}
            onClick={() => {
              close(false);
              onSource();
            }}
          >
            {messages.workspaceSourceText}
          </button>
          <button
            type="button"
            data-item
            className={styles.item}
            onClick={() => {
              close(false);
              onHistory();
            }}
          >
            {messages.historyOpen}
          </button>
          <div role="group" aria-label={messages.workspaceTheme} className={styles.group}>
            <span className={styles.groupLabel} aria-hidden="true">{messages.workspaceTheme}</span>
            <div className={styles.segments}>
              {themes.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  data-item
                  className={styles.segment}
                  aria-pressed={theme === option.value}
                  onClick={() => onTheme(option.value)}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
          <button
            type="button"
            data-item
            className={`${styles.item} ${styles.danger}`}
            onClick={() => {
              close(false);
              onDelete();
            }}
          >
            <Icon name="trash" />
            {messages.workspaceDelete}
          </button>
        </div>
      ) : null}
      {copied ? <span className={styles.srOnly} role="status">{messages.workspaceCopied}</span> : null}
    </div>
  );
}
