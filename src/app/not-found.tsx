import { cookies } from "next/headers";
import Link from "next/link";
import { Card, Text } from "@ds/ui";
import buttonStyles from "@ds/ui/primitives/Button/Button.module.css";
import { getMessages } from "../../messages";
import styles from "../components/centered-page.module.css";
import { LOCALE_COOKIE, parseLocale } from "../lib/locale";

export default async function NotFound() {
  const messages = getMessages(parseLocale((await cookies()).get(LOCALE_COOKIE)?.value));
  return (
    <main className={styles.main}>
      <Card className={styles.card}>
        <Text as="p" variant="heading" className={styles.code}>404</Text>
        <Text as="h1" variant="subheading-serif" className={styles.title}>
          {messages.notFoundTitle}
        </Text>
        <Text tone="muted" className={styles.body}>{messages.notFoundBody}</Text>
        <div className={styles.actions}>
          <Link
            href="/"
            className={`${buttonStyles.button} ${buttonStyles.md} ${buttonStyles.accent} ${styles.linkButton}`}
          >
            {messages.notFoundGenerate}
          </Link>
          <Link
            href="/library"
            className={`${buttonStyles.button} ${buttonStyles.md} ${buttonStyles.outline} ${styles.linkButton}`}
          >
            {messages.notFoundLibrary}
          </Link>
        </div>
      </Card>
    </main>
  );
}
