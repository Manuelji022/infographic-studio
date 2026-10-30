"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import type { CatalogLocale, CatalogSectionProps } from "../types";
import { composeDocument, CSP_IFRAME } from "../../infographic/document.ts";
import { INFOGRAPHIC_SAMPLES } from "../../infographic/samples.ts";
import styles from "./InfographicSection.module.css";

const copy = {
  es: {
    desktop: "Escritorio",
    mobile: "Móvil",
    chartsLink: "Los gráficos de la librería, tipo a tipo, están en",
    strictSandbox: "Las vistas reales usan sandbox estricto sin allow-same-origin",
  },
  en: {
    desktop: "Desktop",
    mobile: "Mobile",
    chartsLink: "Library charts, type by type, are at",
    strictSandbox: "Live views use a strict sandbox without allow-same-origin",
  },
};

type IgFrameProps = {
  fragment: string;
  title: string;
  locale: CatalogLocale;
  theme: CatalogSectionProps["theme"];
  css: string;
};

export function IgFrame({ fragment, title, locale, theme, css }: IgFrameProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const observerRef = useRef<ResizeObserver | undefined>(undefined);
  const observedRef = useRef<Document | undefined>(undefined);
  const [height, setHeight] = useState(80);
  const srcDoc = useMemo(
    () => composeDocument(fragment, { locale, theme, css, csp: CSP_IFRAME, title }),
    [fragment, locale, theme, css, title],
  );

  // Measures the live document and keeps following its size. Idempotent, so it can run from
  // onLoad and from the polling below: a frame can finish loading before React hydrates.
  const measure = () => {
    try {
      const document = iframeRef.current?.contentDocument;
      if (!document?.documentElement) return;
      const updateHeight = () => {
        setHeight(Math.max(80, document.documentElement.scrollHeight));
      };
      updateHeight();
      if (observedRef.current === document) return;
      observedRef.current = document;
      observerRef.current?.disconnect();
      observerRef.current = new ResizeObserver(updateHeight);
      observerRef.current.observe(document.documentElement);
    } catch {
      // Cross-origin access is unavailable; keep the minimum safe frame height.
    }
  };

  useEffect(() => {
    const poll = setInterval(measure, 250);
    const stop = setTimeout(() => clearInterval(poll), 4000);
    return () => {
      clearInterval(poll);
      clearTimeout(stop);
      observerRef.current?.disconnect();
      observedRef.current = undefined;
    };
  }, [srcDoc]);

  // Same-origin access is only for measuring height; the iframe has no script permission.
  return (
    <iframe
      ref={iframeRef}
      className={styles.frame}
      title={title}
      sandbox="allow-same-origin"
      srcDoc={srcDoc}
      onLoad={measure}
      style={{ height }}
    />
  );
}

export function InfographicSection({ locale, theme, infographic }: CatalogSectionProps) {
  const [mobile, setMobile] = useState(false);
  if (!infographic) return null;

  const text = copy[locale];
  return (
    <div className={styles.layout}>
      <div className={styles.controls} role="group" aria-label={text.mobile}>
        <button
          type="button"
          aria-pressed={!mobile}
          onClick={() => setMobile(false)}
        >
          {text.desktop}
        </button>
        <button
          type="button"
          aria-pressed={mobile}
          onClick={() => setMobile(true)}
        >
          {text.mobile}
        </button>
      </div>
      <p className={styles.note}>{text.strictSandbox}</p>
      <p className={styles.chartsLink}>
        {text.chartsLink} <Link href="/charts">/charts</Link>
      </p>
      <div className={`${styles.preview} ${mobile ? styles.mobile : ""}`}>
        {infographic.examples.map((example) => (
          <section className={styles.item} key={example.id}>
            <h3>{locale === "es" ? "Ejemplo: " : "Example: "}{example.title[locale]}</h3>
            <IgFrame
              fragment={example.html[locale]}
              title={example.title[locale]}
              locale={locale}
              theme={theme}
              css={infographic.css}
            />
          </section>
        ))}
        {INFOGRAPHIC_SAMPLES.map((sample) => (
          <section className={styles.item} key={sample.id}>
            <h3>
              {sample.title[locale]} <code>{sample.id}</code>
            </h3>
            <IgFrame
              fragment={sample.html[locale]}
              title={sample.title[locale]}
              locale={locale}
              theme={theme}
              css={infographic.css}
            />
          </section>
        ))}
      </div>
    </div>
  );
}
