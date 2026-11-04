import { Card, Text } from "@ds/ui";
import type { Messages } from "../../messages";
import styles from "./centered-page.module.css";

/** Neutral screen for a share link that does not exist, was revoked or expired (UI_EXPERIENCE §4.9). */
export function SharedUnavailable({ messages }: { messages: Messages }) {
  return (
    <main className={styles.main}>
      <Card className={styles.card}>
        <Text as="h1" variant="subheading-serif" className={styles.title}>
          {messages.sharedUnavailableTitle}
        </Text>
        <Text tone="muted" className={styles.body}>{messages.sharedUnavailableBody}</Text>
      </Card>
    </main>
  );
}
