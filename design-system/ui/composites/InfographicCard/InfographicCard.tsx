import type { ComponentProps, ReactNode } from "react";
import { Badge } from "../../primitives/Badge";
import { Icon } from "../../primitives/Icon";
import { Text } from "../../primitives/Text";
import styles from "./InfographicCard.module.css";

export type InfographicCardProps = Omit<ComponentProps<"article">, "title"> & {
  title: string;
  href: string;
  summary?: string;
  tags?: string[];
  date: string;
  languages: Array<{ code: string; label: string }>;
  sharedLabel?: string;
  thumbnail?: ReactNode;
  moreTagsLabel?: string;
};

export function InfographicCard({
  title, href, summary, tags = [], date, languages, sharedLabel, thumbnail,
  moreTagsLabel, className, ...props
}: InfographicCardProps) {
  const visibleTags = tags.slice(0, 3);
  const hiddenCount = tags.length - visibleTags.length;
  return (
    <article className={`${styles.card}${className ? ` ${className}` : ""}`} {...props}>
      <div className={styles.thumbnail}>{thumbnail}</div>
      <div className={styles.content}>
        <h2 className={`ds-type-title ${styles.heading}`}>
          <a className={styles.titleLink} href={href}>{title}</a>
        </h2>
        {summary ? <Text variant="body-sm" className={styles.summary}>{summary}</Text> : null}
        {tags.length ? (
          <div className={styles.tags}>
            {visibleTags.map((tag, index) => (
              <Badge key={`${tag}-${index}`} variant="outlined">{tag}</Badge>
            ))}
            {hiddenCount > 0 ? (
              <Badge variant="outlined" aria-label={`${moreTagsLabel} ${hiddenCount}`}>
                +{hiddenCount}
              </Badge>
            ) : null}
          </div>
        ) : null}
      </div>
      <footer className={styles.footer}>
        <Text as="span" variant="caption" tone="muted">{date}</Text>
        <div className={styles.meta}>
          {languages.map(({ code, label }) => <Badge key={code} variant="neutral">{label}</Badge>)}
          {sharedLabel ? (
            <span className={`ds-type-caption ${styles.shared}`}>
              <Icon name="share" />{sharedLabel}
            </span>
          ) : null}
        </div>
      </footer>
    </article>
  );
}
