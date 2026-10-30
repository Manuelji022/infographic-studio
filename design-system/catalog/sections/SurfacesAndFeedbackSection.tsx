import type { CatalogSectionProps } from "../types";
import { Card, CardBody, CardFooter, CardHeader } from "../../ui/primitives/Card";
import { Divider } from "../../ui/primitives/Divider";
import { Spinner } from "../../ui/primitives/Spinner";
import { Skeleton } from "../../ui/primitives/Skeleton";
import { VisuallyHidden } from "../../ui/primitives/VisuallyHidden";
import { Button } from "../../ui/primitives/Button";
import { Note } from "../../ui/primitives/Note";
import type { NoteVariant } from "../../ui/primitives/Note";
import styles from "./SurfacesAndFeedbackSection.module.css";

const variants: NoteVariant[] = ["default", "secondary", "success", "warning", "error"];

const copy = {
  es: {
    cards: "Tarjetas", sample: "Una superficie serena para organizar contenido.",
    header: "Encabezado", body: "Cuerpo de la tarjeta", footer: "Pie",
    long:
      "Este texto deliberadamente largo comprueba que el contenido envuelve " +
      "correctamente en pantallas estrechas. ".repeat(2),
    divider: "Divisores", spinner: "Cargando contenido", skeleton: "Esqueletos",
    loading: "Cargando…",
    hidden: "El icono incluye un nombre accesible solo para lectores de pantalla.",
    callout: "Notas",
    variants: {
      default: "Tu cuenta usa el idioma del navegador.",
      secondary: "Los cambios se guardan automáticamente.",
      success: "Las comprobaciones han pasado.",
      warning: "Cambiar el tema regenera la infografía.",
      error: "Ese correo ya está en uso.",
    },
    noteLabel: "Región",
    noteLong: "La región se aplicará a todas las infografías nuevas de esta cuenta.",
    noteAction: "Cambiar", noteSmall: "Pequeña", noteFill: "Rellena", noteNoIcon: "Sin icono",
    noteOutline: "Contorno",
    state: "El foco y el hover se aprecian al interactuar con elementos enfocables.",
  },
  en: {
    cards: "Cards", sample: "A calm surface for organizing content.",
    header: "Header", body: "Card body", footer: "Footer",
    long:
      "This deliberately long text checks that content wraps correctly on " +
      "narrow screens. ".repeat(2),
    divider: "Dividers", spinner: "Loading content", skeleton: "Skeletons",
    loading: "Loading…",
    hidden: "The icon has an accessible name available only to screen readers.",
    callout: "Notes",
    variants: {
      default: "Your account uses the browser language.",
      secondary: "Changes are saved automatically.",
      success: "All checks passed.",
      warning: "Changing the theme regenerates the infographic.",
      error: "That email address is already in use.",
    },
    noteLabel: "Region",
    noteLong: "The region applies to every new infographic in this account.",
    noteAction: "Change", noteSmall: "Small", noteFill: "Filled", noteNoIcon: "No icon",
    noteOutline: "Outline",
    state: "Focus and hover are visible when interacting with focusable elements.",
  },
};

export function SurfacesAndFeedbackSection({ locale }: CatalogSectionProps) {
  const c = copy[locale];

  return (
    <div className={styles.layout}>
      <h3 className="ds-type-title">{c.cards}</h3>
      <div className={styles.grid}>
        <Card>{c.sample}</Card>
        <Card variant="feature">{c.sample}</Card>
        <Card variant="deep">{c.sample}</Card>
        <Card variant="inverse">{c.sample}</Card>
      </div>
      <Card>
        <CardHeader><strong>{c.header}</strong></CardHeader>
        <CardBody>{c.body}</CardBody>
        <CardFooter>{c.footer}</CardFooter>
      </Card>
      <Card variant="inverse">
        <CardHeader><strong>{c.header}</strong></CardHeader>
        <CardBody>{c.body}</CardBody>
        <CardFooter>{c.footer}</CardFooter>
      </Card>
      <Card className={styles.longText}>{c.long}</Card>
      <h3 className="ds-type-title">{c.divider}</h3>
      <div className={styles.stack}>
        <Divider />
        <Divider tone="strong" />
        <div className={styles.row}>
          <Divider orientation="vertical" />
          <span>{c.sample}</span>
          <Divider orientation="vertical" tone="strong" />
        </div>
        <Card variant="inverse"><Divider /><Divider tone="strong" /></Card>
      </div>
      <h3 className="ds-type-title">{c.spinner}</h3>
      <div className={styles.row}>
        <Spinner size="sm" label={c.spinner} />
        <Spinner size="md" label={c.spinner} />
        <Spinner size="lg" label={c.spinner} />
      </div>
      <h3 className="ds-type-title">{c.skeleton}</h3>
      <div className={styles.stack}>
        <Skeleton variant="text" />
        <Skeleton variant="block" />
        <Skeleton variant="circle" />
        <Card>
          <div className={styles.stack}>
            <Skeleton variant="text" width="60%" />
            <Skeleton variant="block" />
            <span className="ds-type-caption">{c.loading}</span>
          </div>
        </Card>
      </div>
      <div className={styles.row}>
        <span aria-hidden="true">◉</span>
        <VisuallyHidden>{c.spinner}</VisuallyHidden>
        <span className="ds-type-caption">{c.hidden}</span>
      </div>
      <h3 className="ds-type-title">{c.callout}</h3>
      <div className={styles.stack}>
        <p className="ds-type-caption">{c.noteOutline}</p>
        {variants.map((variant) => (
          <Note key={variant} variant={variant}>{c.variants[variant]}</Note>
        ))}
        <p className="ds-type-caption">{c.noteFill}</p>
        {variants.map((variant) => (
          <Note key={variant} variant={variant} appearance="fill">{c.variants[variant]}</Note>
        ))}
        <p className="ds-type-caption">{c.noteSmall}</p>
        <Note variant="warning" size="small">{c.variants.warning}</Note>
        <Note variant="error" size="small" appearance="fill">{c.variants.error}</Note>
        <p className="ds-type-caption">{c.noteLabel} · {c.noteAction} · {c.noteNoIcon}</p>
        <Note
          variant="warning"
          label={c.noteLabel}
          action={<Button variant="outline" size="sm">{c.noteAction}</Button>}
        >
          {c.noteLong}
        </Note>
        <Note icon={null}>{c.variants.default}</Note>
        <Card><Note variant="success" appearance="fill">{c.variants.success}</Note></Card>
      </div>
      <p className="ds-type-caption-medium">{c.state}</p>
    </div>
  );
}
