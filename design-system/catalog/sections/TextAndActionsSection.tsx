import { Badge } from "../../ui/primitives/Badge";
import { Button } from "../../ui/primitives/Button";
import { Icon } from "../../ui/primitives/Icon";
import { Link } from "../../ui/primitives/Link";
import { Text } from "../../ui/primitives/Text";
import type { CatalogSectionProps } from "../types";
import styles from "./TextAndActionsSection.module.css";

const copy = {
  es: {
    text: "Una muestra tipográfica para leer con claridad.",
    title: "Texto y acciones",
    tones: "Tonos",
    actions: "Botones",
    badges: "Insignias",
    icons: "Iconos",
    caption: "El foco y el estado al pasar el cursor se aprecian al interactuar.",
    primaryCaption: "Clay se reserva para una única acción principal.",
    link: "Leer más",
    action: "Continuar",
    disabled: "Desactivado",
    paragraph: "Consulta la guía y descubre cómo aplicar el sistema.",
  },
  en: {
    text: "A typographic sample, designed for clear reading.",
    title: "Text and actions",
    tones: "Tones",
    actions: "Buttons",
    badges: "Badges",
    icons: "Icons",
    caption: "Focus and hover are visible when interacting with controls.",
    primaryCaption: "Clay is reserved for one primary action.",
    link: "Read more",
    action: "Continue",
    disabled: "Disabled",
    paragraph: "Read the guide to discover how to apply the system.",
  },
};

const variants = [
  "display", "heading", "subheading-serif", "subheading-sans", "title",
  "body", "body-lg", "body-strong", "body-sm", "ui", "ui-medium",
  "ui-strong", "ui-sm", "caption", "caption-medium", "label", "code",
] as const;

const iconNames = [
  "chevron-down", "chevron-right", "arrow-right", "close",
  "check", "copy", "share", "trash", "sun", "moon", "monitor-cog",
] as const;

export function TextAndActionsSection({ locale }: CatalogSectionProps) {
  const content = copy[locale];

  return (
    <div className={styles.catalog}>
      <div className={styles.group}>
        <h3 className="ds-type-title">Text</h3>
        <div className={styles.texts}>
          {variants.map((variant) => (
            <Text key={variant} variant={variant}>
              {variant}: {content.text}
            </Text>
          ))}
        </div>
        <h4 className="ds-type-caption-medium">{content.tones}</h4>
        <Text tone="default">{content.text}</Text>
        <Text tone="muted">{content.text}</Text>
        <div className={styles.inverse}>
          <Text tone="inverse">{content.text}</Text>
        </div>
      </div>
      <div className={styles.group}>
        <h3 className="ds-type-title">{content.actions}</h3>
        <div className={styles.buttonRow}>
          <Button variant="accent" size="md">{content.action}</Button>
          <Button variant="ivory" size="md">Ivory</Button>
          <Button variant="outline" size="md">Outline</Button>
          <Button variant="ghost" size="md">Ghost</Button>
          <Button variant="ivory" size="sm">Small</Button>
          <Button variant="outline" size="sm" disabled>{content.disabled}</Button>
          <Button variant="ivory" size="sm"><Icon name="arrow-right" />{content.action}</Button>
        </div>
        <div className={`${styles.buttonRow} ${styles.deep}`}>
          <Button variant="ivory" size="md">Ivory</Button>
          <Button variant="outline" size="md" tone="inverse">Outline</Button>
          <Button variant="ghost" size="md" tone="inverse">Ghost</Button>
          <Button variant="ivory" size="sm">Small</Button>
          <Button variant="outline" size="sm" tone="inverse" disabled>{content.disabled}</Button>
        </div>
        <p className="ds-type-caption">
          {content.caption} {content.primaryCaption}
        </p>
        <p className={"ds-type-ui " + styles.paragraph}>
          {content.paragraph} <Link href="#text">{content.link}</Link>
        </p>
        <div className={styles.inverse}>
          <Link tone="inverse" href="#text">{content.link}</Link>
        </div>
      </div>
      <div className={styles.group}>
        <h3 className="ds-type-title">{content.badges}</h3>
        <div className={styles.row}>
          <Badge variant="neutral">Neutral</Badge>
          <Badge variant="outlined">Outlined</Badge>
          <Badge variant="solid">Solid</Badge>
        </div>
      </div>
      <div className={styles.group}>
        <h3 className="ds-type-title">{content.icons}</h3>
        <div className={styles.iconGrid}>
          {iconNames.map((name) => (
            <div className={styles.iconCell} key={name}>
              <Icon name={name} size="sm" />
              <Icon name={name} size="md" />
              <Icon name={name} size="lg" title={name === "check" ? content.action : undefined} />
              <span className="ds-type-caption">{name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
