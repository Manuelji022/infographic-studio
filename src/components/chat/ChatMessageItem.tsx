import { Button, Spinner } from "@ds/ui";
import type { Messages } from "../../../messages";
import { blockTypeLabel } from "./block-labels";
import type { ChatMessage } from "./types";
import styles from "./ChatPanel.module.css";

export function ChatMessageItem({
  message,
  messages,
  applied,
  canUndo,
  busy,
  onRetry,
  onUndo,
  onHighlightBlock,
}: {
  message: ChatMessage;
  messages: Messages;
  /** The edit this reply describes is currently applied (false once undone). */
  applied: boolean;
  /** This reply is the latest applied edit, so it carries the Undo button. */
  canUndo: boolean;
  busy: boolean;
  onRetry: (id: string) => void;
  onUndo: (entryId: string) => void;
  onHighlightBlock: (id: string) => void;
}) {
  if (message.role === "user") {
    return (
      <li className={`${styles.message} ${styles.fromUser}`}>
        <span className={styles.who}>{messages.chatYou}</span>
        <div className={styles.bubble}>
          {message.block ? (
            <span className={styles.scope}>
              {blockTypeLabel(messages, message.block.type)}: {message.block.name}
            </span>
          ) : null}
          {message.text}
        </div>
      </li>
    );
  }

  return (
    <li className={styles.message}>
      <span className={styles.who}>{messages.chatAssistant}</span>
      {message.status === "pending" ? (
        <div className={styles.reply}>
          <Spinner size="sm" label={messages.chatWorking} />
          <span aria-hidden="true">{messages.chatWorking}</span>
        </div>
      ) : null}
      {message.status === "notPossible" ? <p className={styles.reply}>{messages.chatNotPossible}</p> : null}
      {message.status === "error" ? (
        <div className={styles.replyColumn}>
          <p className={styles.errorText}>{messages.chatError}</p>
          <Button variant="outline" size="sm" disabled={busy} onClick={() => onRetry(message.id)}>
            {messages.chatRetry}
          </Button>
        </div>
      ) : null}
      {message.status === "done" ? (
        applied ? (
          <div className={styles.replyColumn}>
            <p>
              {message.blocks.length === 1
                ? messages.chatChangedBlock
                : messages.chatChangedBlocks.replace("{count}", String(message.blocks.length))}
            </p>
            <ul className={styles.chips}>
              {message.blocks.map((block) => (
                <li key={block.id}>
                  <button
                    type="button"
                    className={styles.blockChip}
                    aria-label={messages.chatHighlightBlock.replace("{name}", block.name)}
                    onClick={() => onHighlightBlock(block.id)}
                  >
                    {block.name}
                  </button>
                </li>
              ))}
            </ul>
            {canUndo ? (
              <Button variant="outline" size="sm" disabled={busy} onClick={() => onUndo(message.entryId)}>
                {messages.chatUndo}
              </Button>
            ) : null}
          </div>
        ) : (
          <p className={styles.reply}>{messages.chatUndone}</p>
        )
      ) : null}
    </li>
  );
}
