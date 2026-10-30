"use client";

import { useState } from "react";
import type { CatalogSectionProps } from "../types";
import { AppHeader } from "../../ui/composites/AppHeader";
import { LanguageToggle } from "../../ui/composites/LanguageToggle";
import { UserMenu } from "../../ui/composites/UserMenu";
import styles from "./NavigationSection.module.css";

const copy = {
  es: {
    title: "Idioma", languageLabel: "Idioma", spanish: "ES", english: "EN",
    spanishName: "Español", englishName: "English", userMenu: "Menú de usuario",
    account: "Mi cuenta", signOut: "Cerrar sesión", selected: "Acciones seleccionadas",
    languageNote: "El idioma activo se marca con el fondo oscuro.",
    popover: "Pulsa el botón para abrir el panel emergente.", header: "Cabecera completa",
    brand: "Infographic Studio", nav: "Navegación principal", generate: "Generar",
    library: "Biblioteca", design: "Design system", noSession: "Sin sesión",
    menu: "Menú de usuario",
  },
  en: {
    title: "Language", languageLabel: "Language", spanish: "ES", english: "EN",
    spanishName: "Español", englishName: "English", userMenu: "User menu",
    account: "My account", signOut: "Sign out", selected: "Selected actions",
    languageNote: "The active language is marked with the dark background.",
    popover: "Press the button to open the popover panel.", header: "Full header",
    brand: "Infographic Studio", nav: "Main navigation", generate: "Generate",
    library: "Library", design: "Design system", noSession: "Signed out",
    menu: "User menu",
  },
};

export function NavigationSection({ locale }: CatalogSectionProps) {
  const c = copy[locale];
  const [language, setLanguage] = useState(locale === "es" ? "es" : "en");
  const [selected, setSelected] = useState(0);
  const labels = {
    label: c.languageLabel,
    options: [
      { value: "es", label: c.spanish, ariaLabel: c.spanishName },
      { value: "en", label: c.english, ariaLabel: c.englishName },
    ],
  };
  const toggle = <LanguageToggle value={language} options={labels.options}
    onChange={setLanguage} label={labels.label} />;
  const menuItems = [
    { key: "account", label: c.account, href: "#" },
    { key: "signout", label: c.signOut, onSelect: () => setSelected((n) => n + 1) },
  ];
  const userMenu = <UserMenu name="Ana García" email="ana@example.com"
    triggerLabel={c.menu} items={menuItems} />;

  return (
    <div className={styles.layout}>
      <h3 className="ds-type-title">{c.title}</h3>
      <p className="ds-type-caption">{c.languageNote}</p>
      {toggle}
      <h3 className="ds-type-title">{c.userMenu}</h3>
      <div className={styles.menuRow}>{userMenu}</div>
      <p className="ds-type-caption">{c.popover} {c.selected}: {selected}</p>
      <h3 className="ds-type-title">{c.header}</h3>
      <div className={styles.frame}>
        <AppHeader brand={<a href="#">{c.brand}</a>} navLabel={c.nav}
          items={[
            { key: "generate", label: c.generate, href: "#" },
            { key: "library", label: c.library, href: "#", current: true },
            { key: "design", label: c.design, href: "#" },
          ]}
          actions={<><LanguageToggle value={language} options={labels.options}
            onChange={setLanguage} label={labels.label} />{userMenu}</>} />
      </div>
      <h3 className="ds-type-title">{c.noSession}</h3>
      <div className={styles.frame}>
        <AppHeader brand={<a href="#">{c.brand}</a>} navLabel={c.nav} items={[]}
          actions={toggle} />
      </div>
    </div>
  );
}
