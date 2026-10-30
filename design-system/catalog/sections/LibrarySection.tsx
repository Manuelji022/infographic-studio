"use client";

import { useState } from "react";
import type { CatalogSectionProps } from "../types";
import { InfographicCard } from "../../ui/composites/InfographicCard";
import { SearchBar } from "../../ui/composites/SearchBar";
import { FilterBar } from "../../ui/composites/FilterBar";
import type { FilterBarValues } from "../../ui/composites/FilterBar/FilterBar";
import styles from "./LibrarySection.module.css";

const copy = {
  es: {
    cards: "Tarjetas de infografía", complete: "Infografía completa",
    minimal: "Infografía mínima",
    longTitle: "Una historia extensa sobre cómo cambian las ciudades y " +
      "sus comunidades con el paso del tiempo",
    summary: "Un resumen deliberadamente extenso para mostrar cómo se distribuye " +
      "el contenido cuando la tarjeta dispone de poco espacio. Analiza datos, " +
      "tendencias y cambios a lo largo de varias generaciones.",
    tags: ["Ciudades", "Datos", "Cultura", "Historia"], date: "12 oct 2026",
    languages: [{ code: "es", label: "ES" }, { code: "en", label: "EN" }],
    shared: "Compartida", more: "etiquetas más", search: "Búsqueda",
    searchLabel: "Buscar infografías", placeholder: "Buscar…", clear: "Limpiar búsqueda",
    submit: "Buscar", empty: "Estado vacío", populated: "Con texto",
    interactive: "Interactivo: escribe o borra el texto.",
    filtersNote: "Interactivo: cambia los filtros.", filters: "Filtros",
    filterLabel: "Filtros de infografías", tagLabel: "Etiqueta", dateLabel: "Fecha",
    languageLabel: "Idioma", sharedLabel: "Solo compartidas", clearFilters: "Limpiar filtros",
    allTags: "Todas las etiquetas", anyDate: "Cualquier fecha", week: "Última semana",
    month: "Último mes", allLanguages: "Todos los idiomas", active: "Filtros activos",
    minimum: "Solo título, fecha e idioma.",
  },
  en: {
    cards: "Infographic cards", complete: "Complete infographic",
    minimal: "Minimal infographic",
    longTitle: "A detailed story of how cities and their communities " +
      "change over the course of time",
    summary: "A deliberately long summary to show how content wraps when a card " +
      "has limited space. It explores data, trends, and change across generations.",
    tags: ["Cities", "Data", "Culture", "History"], date: "Oct 12, 2026",
    languages: [{ code: "es", label: "ES" }, { code: "en", label: "EN" }],
    shared: "Shared", more: "more tags", search: "Search",
    searchLabel: "Search infographics", placeholder: "Search…", clear: "Clear search",
    submit: "Search", empty: "Empty state", populated: "With text",
    interactive: "Interactive: type or clear the text.",
    filtersNote: "Interactive: change the filters.", filters: "Filters",
    filterLabel: "Infographic filters", tagLabel: "Tag", dateLabel: "Date",
    languageLabel: "Language", sharedLabel: "Shared only", clearFilters: "Clear filters",
    allTags: "All tags", anyDate: "Any date", week: "Last week",
    month: "Last month", allLanguages: "All languages", active: "Active filters",
    minimum: "Title, date, and language only.",
  },
};

const emptyFilters: FilterBarValues = { tag: "", date: "", language: "", sharedOnly: false };

export function LibrarySection({ locale }: CatalogSectionProps) {
  const c = copy[locale];
  const [query, setQuery] = useState(locale === "es" ? "ciudades" : "cities");
  const [filters, setFilters] = useState(emptyFilters);
  const [activeFilters, setActiveFilters] = useState<FilterBarValues>({
    tag: "cities", date: "week", language: "es", sharedOnly: true,
  });
  const labels = {
    tagLabel: c.tagLabel, dateLabel: c.dateLabel, languageLabel: c.languageLabel,
    sharedLabel: c.sharedLabel, clear: c.clearFilters,
  };
  const tagOptions = [{ value: "", label: c.allTags }, ...c.tags.map((tag) => ({
    value: tag.toLowerCase(), label: tag,
  }))];
  const dateOptions = [
    { value: "", label: c.anyDate }, { value: "week", label: c.week },
    { value: "month", label: c.month },
  ];
  const languageOptions = [
    { value: "", label: c.allLanguages }, { value: "es", label: "ES" },
    { value: "en", label: "EN" },
  ];
  const thumbnail = <div className={styles.thumbSample} aria-hidden="true">
    <div className={styles.barOne} /><div className={styles.barTwo} />
    <div className={styles.barThree} />
  </div>;

  return <div className={styles.layout}>
    <h3 className="ds-type-title">{c.cards}</h3>
    <p className="ds-type-caption">{c.complete}</p>
    <div className={styles.grid}>
      <InfographicCard title={c.longTitle} href="#" summary={c.summary} tags={c.tags}
        date={c.date} languages={c.languages} sharedLabel={c.shared} thumbnail={thumbnail}
        moreTagsLabel={c.more} />
      <InfographicCard title={c.longTitle} href="#" date={c.date}
        languages={[c.languages[0]]} />
    </div>
    <p className="ds-type-caption">{c.minimum}</p>
    <h3 className="ds-type-title">{c.search}</h3>
    <p className="ds-type-caption">{c.empty}</p>
    <SearchBar value="" onChange={() => undefined} label={c.searchLabel}
      placeholder={c.placeholder} clearLabel={c.clear} submitLabel={c.submit} />
    <p className="ds-type-caption">{c.populated} — {c.interactive}</p>
    <SearchBar value={query} onChange={setQuery} label={c.searchLabel}
      placeholder={c.placeholder} clearLabel={c.clear} submitLabel={c.submit} />
    <h3 className="ds-type-title">{c.filters}</h3>
    <p className="ds-type-caption">{c.filtersNote}</p>
    <FilterBar values={filters} onChange={setFilters} labels={labels} label={c.filterLabel}
      tagOptions={tagOptions} dateOptions={dateOptions} languageOptions={languageOptions} />
    <p className="ds-type-caption">{c.active}</p>
    <FilterBar values={activeFilters} onChange={setActiveFilters} labels={labels}
      label={c.filterLabel} tagOptions={tagOptions} dateOptions={dateOptions}
      languageOptions={languageOptions} />
  </div>;
}
