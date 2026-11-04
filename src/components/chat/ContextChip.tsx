import { Icon } from "@ds/ui";
import type { Messages } from "../../../messages";
import { blockTypeLabel } from "./block-labels";
import type { SelectedBlock } from "./types";
import styles from "./ContextChip.module.css";

/** "Chart: Spending by function ✕" — shows which block the next instruction applies to (D4). */
export function ContextChip({
  block,
  messages,
  onClear,
}: {
  block: SelectedBlock;
  messages: Messages;
  onClear: () => void;
}) {
  return (
    <div className={styles.chip} role="group" aria-label={messages.chatContextLabel}>
      <span className={styles.text}>
        <span className={styles.kind}>{blockTypeLabel(messages, block.type)}:</span>{" "}
        <span className={styles.name}>{block.name}</span>
      </span>
      <button type="button" className={styles.clear} aria-label={messages.chatContextRemove} onClick={onClear}>
        <Icon name="close" />
      </button>
    </div>
  );
}
