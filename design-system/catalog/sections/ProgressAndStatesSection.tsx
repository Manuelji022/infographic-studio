"use client";

import { useEffect, useState } from "react";
import type { CatalogSectionProps } from "../types";
import { Button } from "../../ui/primitives/Button";
import { EmptyState } from "../../ui/composites/EmptyState";
import { ErrorState } from "../../ui/composites/ErrorState";
import { GenerationProgress } from "../../ui/composites/GenerationProgress";
import styles from "./ProgressAndStatesSection.module.css";

const copy = {
  es: {
    progress: "Progreso de generación",
    allPending: "Todos los pasos pendientes",
    firstActive: "Primer paso activo",
    thirdActive: "Tercer paso activo",
    allDone: "Todos los pasos completados",
    thirdError: "Error en el tercer paso",
    pending: "Pendiente",
    active: "Activo (En curso)",
    done: "Hecho",
    error: "Error",
    stepLabels: [
      "Analizando el texto",
      "Componiendo la infografía",
      "Validando el resultado",
      "Guardando",
    ],
    simulate: "Simular",
    stop: "Detener simulación",
    animation: "Demostración animada",
    empty: "Estados vacíos",
    emptyTitle: "Aún no hay infografías",
    emptyDescription: "Crea una infografía para verla aquí.",
    create: "Crear infografía",
    emptySimpleTitle: "No hay resultados",
    emptySimpleDescription: "Prueba con otros términos de búsqueda.",
    errors: "Estados de error",
    errorTitle: "No se pudo generar la infografía",
    errorDescription: "Se produjo un problema durante la generación.",
    retry: "Reintentar",
    detail: "Código de error: GEN-042 · Tiempo de espera agotado",
    simpleErrorTitle: "No se pudo cargar el contenido",
    simpleErrorDescription: "Comprueba la conexión e inténtalo de nuevo.",
    retryCount: (count: number) => `Reintentado ${count} veces`,
  },
  en: {
    progress: "Generation progress",
    allPending: "All steps pending",
    firstActive: "First step active",
    thirdActive: "Third step active",
    allDone: "All steps complete",
    thirdError: "Error on the third step",
    pending: "Pending",
    active: "Active (In progress)",
    done: "Done",
    error: "Error",
    stepLabels: [
      "Analyzing the text",
      "Composing the infographic",
      "Validating the result",
      "Saving",
    ],
    simulate: "Simulate",
    stop: "Stop simulation",
    animation: "Animated demo",
    empty: "Empty states",
    emptyTitle: "No infographics yet",
    emptyDescription: "Create an infographic to see it here.",
    create: "Create infographic",
    emptySimpleTitle: "No results",
    emptySimpleDescription: "Try different search terms.",
    errors: "Error states",
    errorTitle: "Could not generate the infographic",
    errorDescription: "A problem occurred during generation.",
    retry: "Retry",
    detail: "Error code: GEN-042 · Request timed out",
    simpleErrorTitle: "Could not load content",
    simpleErrorDescription: "Check your connection and try again.",
    retryCount: (count: number) => `Retried ${count} times`,
  },
};

type Status = "pending" | "active" | "done" | "error";

export function ProgressAndStatesSection({ locale }: CatalogSectionProps) {
  const c = copy[locale];
  const [animationStep, setAnimationStep] = useState(0);
  const [animating, setAnimating] = useState(false);
  const [retries, setRetries] = useState(0);

  useEffect(() => {
    if (!animating) return;
    const timer = window.setInterval(() => {
      setAnimationStep((current) => {
        if (current >= 4) {
          window.clearInterval(timer);
          setAnimating(false);
          return 4;
        }
        return current + 1;
      });
    }, 900);
    return () => window.clearInterval(timer);
  }, [animating]);

  const progress = (statuses: Status[], label: string) => (
    <GenerationProgress
      label={label}
      steps={c.stepLabels.map((step, index) => ({
        key: step,
        label: step,
        status: statuses[index],
        statusLabel: {
          pending: c.pending,
          active: c.active,
          done: c.done,
          error: c.error,
        }[statuses[index]],
      }))}
    />
  );
  const animatedStatuses: Status[] = c.stepLabels.map((_, index) => {
    if (index < animationStep) return "done";
    return index === animationStep && animationStep < 4 ? "active" : "pending";
  });
  const startSimulation = () => {
    setAnimationStep(0);
    setAnimating(true);
  };

  return (
    <div className={styles.layout}>
      <h3 className="ds-type-title">{c.progress}</h3>
      <div className={styles.grid}>
        <section className={styles.item}>
          <h3 className="ds-type-title">{c.allPending}</h3>
          <p className="ds-type-caption">{c.pending}</p>
          {progress(["pending", "pending", "pending", "pending"], c.allPending)}
        </section>
        <section className={styles.item}>
          <h3 className="ds-type-title">{c.firstActive}</h3>
          <p className="ds-type-caption">{c.active}</p>
          {progress(["active", "pending", "pending", "pending"], c.firstActive)}
        </section>
        <section className={styles.item}>
          <h3 className="ds-type-title">{c.thirdActive}</h3>
          <p className="ds-type-caption">{c.done} · {c.active}</p>
          {progress(["done", "done", "active", "pending"], c.thirdActive)}
        </section>
        <section className={styles.item}>
          <h3 className="ds-type-title">{c.allDone}</h3>
          <p className="ds-type-caption">{c.done}</p>
          {progress(["done", "done", "done", "done"], c.allDone)}
        </section>
        <section className={styles.item}>
          <h3 className="ds-type-title">{c.thirdError}</h3>
          <p className="ds-type-caption">{c.error}</p>
          {progress(["done", "done", "error", "pending"], c.thirdError)}
        </section>
      </div>
      <section className={styles.item}>
        <h3 className="ds-type-title">{c.animation}</h3>
        <p className="ds-type-caption">{animating ? c.active : c.pending}</p>
        <div className={styles.stack}>
          {progress(animatedStatuses, c.animation)}
          <Button variant="ivory" onClick={startSimulation} disabled={animating}>
            {animating ? c.stop : c.simulate}
          </Button>
        </div>
      </section>
      <h3 className="ds-type-title">{c.empty}</h3>
      <div className={styles.grid}>
        <section className={styles.item}>
          <h3 className="ds-type-title">{c.emptyTitle}</h3>
          <p className="ds-type-caption">{c.emptyDescription}</p>
          <EmptyState
            icon="search"
            title={c.emptyTitle}
            description={c.emptyDescription}
            action={<Button variant="outline">{c.create}</Button>}
          />
        </section>
        <section className={styles.item}>
          <h3 className="ds-type-title">{c.emptySimpleTitle}</h3>
          <p className="ds-type-caption">{c.emptySimpleDescription}</p>
          <EmptyState title={c.emptySimpleTitle} description={c.emptySimpleDescription} />
        </section>
      </div>
      <h3 className="ds-type-title">{c.errors}</h3>
      <div className={styles.grid}>
        <section className={styles.item}>
          <h3 className="ds-type-title">{c.errorTitle}</h3>
          <p className="ds-type-caption">{c.detail}</p>
          <ErrorState
            title={c.errorTitle}
            description={c.errorDescription}
            retryLabel={c.retry}
            detail={c.detail}
            onRetry={() => setRetries((count) => count + 1)}
          />
          <p className="ds-type-caption">{c.retryCount(retries)}</p>
        </section>
        <section className={styles.item}>
          <h3 className="ds-type-title">{c.simpleErrorTitle}</h3>
          <p className="ds-type-caption">{c.simpleErrorDescription}</p>
          <ErrorState
            title={c.simpleErrorTitle}
            description={c.simpleErrorDescription}
            retryLabel={c.retry}
            onRetry={() => setRetries((count) => count + 1)}
          />
          <p className="ds-type-caption">{c.retryCount(retries)}</p>
        </section>
      </div>
    </div>
  );
}
