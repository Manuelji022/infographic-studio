// Server-only in-memory mock of the database. Replaced by Drizzle queries in M3.
// State lives on globalThis so it survives hot reloads in `next dev`; it resets on restart.
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { ensureBlockIds } from "./blocks.ts";
import type {
  ContentSnapshot,
  ContentTypeId,
  EditEntry,
  HistoryView,
  InfographicContent,
  Locale,
  MockComment,
  MockInfographic,
  SharedLookup,
  ShareLink,
} from "./types";

type Seed = {
  id: string;
  example: "pensiones" | "gasto-publico";
  contentType: ContentTypeId;
  daysAgo: number;
  tags: Record<Locale, string[]>;
  titles: Partial<Record<Locale, string>>; // overrides the example's own title
  summaries: Record<Locale, string>;
  locales: Locale[];
  share?: "active" | "expired" | "revoked";
};

const SEEDS: Seed[] = [
  {
    id: "pensiones",
    example: "pensiones",
    contentType: "article",
    daysAgo: 1,
    tags: { es: ["pensiones", "demografía", "gasto"], en: ["pensions", "demographics", "spending"] },
    titles: {},
    summaries: {
      es: "Una mirada a gasto, demografía y decisiones de largo plazo.",
      en: "A look at spending, demographics and long-term choices.",
    },
    locales: ["es", "en"],
    share: "active",
  },
  {
    id: "gasto-publico",
    example: "gasto-publico",
    contentType: "financial",
    daysAgo: 3,
    tags: { es: ["gasto público", "presupuestos"], en: ["public spending", "budgets"] },
    titles: {},
    summaries: {
      es: "Cómo se reparte el gasto público por función.",
      en: "How public spending is split by function.",
    },
    locales: ["es", "en"],
  },
  ...[
    ["entrevista-energia", "pensiones", "interview", 5, ["energía", "entrevista"], ["energy", "interview"], "Entrevista: el futuro de la energía", "Interview: the future of energy"],
    ["resultados-t3", "gasto-publico", "financial", 8, ["resultados", "trimestral"], ["results", "quarterly"], "Resultados del tercer trimestre", "Third-quarter results"],
    ["vivienda-alquiler", "pensiones", "article", 12, ["vivienda", "alquiler"], ["housing", "rent"], "El alquiler pesa cada vez más", "Rent weighs more every year"],
    ["empleo-juvenil", "gasto-publico", "article", 15, ["empleo", "jóvenes"], ["jobs", "youth"], "Empleo juvenil: la brecha persiste", "Youth employment: the gap persists"],
    ["salud-mental", "pensiones", "interview", 20, ["salud", "bienestar"], ["health", "wellbeing"], "Conversación sobre salud mental", "A conversation on mental health"],
    ["inflacion-alimentos", "gasto-publico", "financial", 27, ["inflación", "alimentos"], ["inflation", "food"], "Inflación de los alimentos", "Food inflation"],
  ].map(
    ([id, example, contentType, daysAgo, tagsEs, tagsEn, titleEs, titleEn], index): Seed => ({
      id: id as string,
      example: example as Seed["example"],
      contentType: contentType as ContentTypeId,
      daysAgo: daysAgo as number,
      tags: { es: tagsEs as string[], en: tagsEn as string[] },
      titles: { es: titleEs as string, en: titleEn as string },
      summaries: {
        es: "Infografía de ejemplo con datos ilustrativos para probar la interfaz.",
        en: "Sample infographic with illustrative data to exercise the interface.",
      },
      locales: index % 3 === 0 ? ["es"] : ["es", "en"],
      share: index === 2 ? "expired" : index === 4 ? "revoked" : undefined,
    }),
  ),
];

function readExample(example: string, locale: Locale) {
  const dir = path.join(process.cwd(), "design-system", "examples");
  const html = readFileSync(path.join(dir, `${example}.${locale}.html`), "utf8");
  const chartsPath = path.join(dir, `${example}.charts.${locale}.json`);
  const charts = existsSync(chartsPath) ? (JSON.parse(readFileSync(chartsPath, "utf8")) as unknown[]) : [];
  const match = /<h1 class="ig-header__title">([\s\S]*?)<\/h1>/.exec(html);
  const title = match ? match[1].replace(/<[^>]*>/g, "") : example;
  return { html, charts, title };
}

function daysFromNow(days: number): string {
  return new Date(Date.now() + days * 86_400_000).toISOString();
}

function buildSeed(seed: Seed): MockInfographic {
  const contents: Partial<Record<Locale, InfographicContent>> = {};
  for (const locale of seed.locales) {
    const example = readExample(seed.example, locale);
    // Ids are assigned here, once, and stored with the html (see blocks.ts).
    const ids = ensureBlockIds(example.html, 0, { charts: example.charts });
    if (!ids.ok) throw new Error(`Example ${seed.example}.${locale} is malformed: ${ids.reason}`);
    contents[locale] = {
      locale,
      title: seed.titles[locale] ?? example.title,
      summary: seed.summaries[locale],
      tags: seed.tags[locale],
      html: ids.html,
      blockSeq: ids.seq,
      charts: example.charts,
      isTranslation: locale !== "es",
    };
  }
  const createdAt = daysFromNow(-seed.daysAgo);
  const share: ShareLink | null = seed.share
    ? {
        token: `demo-${seed.share === "active" ? "activa" : seed.share === "expired" ? "caducada" : "revocada"}`,
        defaultLocale: null,
        expiresAt: seed.share === "expired" ? daysFromNow(-1) : null,
        revokedAt: seed.share === "revoked" ? daysFromNow(-2) : null,
        createdAt,
      }
    : null;
  return {
    id: seed.id,
    createdAt,
    updatedAt: createdAt,
    originalLocale: "es",
    contentType: seed.contentType,
    sourceUrl: null,
    sourceText: "Texto original de ejemplo. En la fase real, aquí va el texto pegado por el propietario.",
    contents,
    share,
  };
}

type Db = { items: Map<string, MockInfographic> };
const globalStore = globalThis as unknown as { __mockDb?: Db };

function db(): Db {
  if (!globalStore.__mockDb) {
    globalStore.__mockDb = { items: new Map(SEEDS.map((seed) => [seed.id, buildSeed(seed)])) };
  }
  return globalStore.__mockDb;
}

/** Newest first. */
export function listInfographics(): MockInfographic[] {
  return [...db().items.values()].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function getInfographic(id: string): MockInfographic | null {
  return db().items.get(id) ?? null;
}

export function putInfographic(infographic: MockInfographic): void {
  db().items.set(infographic.id, infographic);
}

export function removeInfographic(id: string): boolean {
  return db().items.delete(id);
}

export function isLinkActive(link: ShareLink | null): link is ShareLink {
  if (!link || link.revokedAt) return false;
  return link.expiresAt === null || new Date(link.expiresAt).getTime() > Date.now();
}

/** Revoked, expired and unknown tokens all return the same `{ found: false }`. */
export function lookupSharedToken(token: string): SharedLookup {
  for (const infographic of db().items.values()) {
    if (infographic.share?.token === token && isLinkActive(infographic.share)) {
      return { found: true, infographic, link: infographic.share };
    }
  }
  return { found: false };
}

export function newToken(): string {
  return crypto.randomUUID().replaceAll("-", "") + crypto.randomUUID().replaceAll("-", "").slice(0, 8);
}

export function pickExampleFor(contentType: ContentTypeId, text: string): Seed["example"] {
  if (contentType === "financial") return "gasto-publico";
  if (contentType === "auto" && /gasto|spending|budget|presupuesto/i.test(text)) return "gasto-publico";
  return "pensiones";
}

export function buildFromExample(
  id: string,
  example: Seed["example"],
  input: { contentType: ContentTypeId; sourceUrl: string | null; sourceText: string },
): MockInfographic {
  const base = buildSeed({
    id,
    example,
    contentType: input.contentType,
    daysAgo: 0,
    tags: { es: ["nuevo"], en: ["new"] },
    titles: {},
    summaries: { es: "Generada con el agente simulado.", en: "Generated by the mock agent." },
    locales: ["es"],
  });
  return { ...base, sourceUrl: input.sourceUrl, sourceText: input.sourceText };
}

export function historyView(infographic: MockInfographic): HistoryView {
  const entries = (infographic.history ?? []).map(
    ({ id, instruction, scope, blockIds, blockNames, createdAt }) => ({
      id,
      instruction,
      scope,
      blockIds,
      blockNames,
      createdAt,
    }),
  );
  return { entries, cursor: infographic.historyCursor ?? 0 };
}

function withSnapshots(
  infographic: MockInfographic,
  snapshots: Partial<Record<Locale, ContentSnapshot>>,
): MockInfographic["contents"] {
  const contents = { ...infographic.contents };
  for (const [locale, snapshot] of Object.entries(snapshots) as Array<[Locale, ContentSnapshot]>) {
    const current = contents[locale];
    // The id counter never goes back, even when an undo restores an older snapshot.
    if (current) {
      contents[locale] = {
        ...current,
        html: snapshot.html,
        charts: snapshot.charts,
        blockSeq: Math.max(current.blockSeq, snapshot.blockSeq),
      };
    }
  }
  return contents;
}

/** Records a successful edit: applies its `after` content and drops any redo tail. */
export function pushEdit(id: string, entry: EditEntry): MockInfographic | null {
  const infographic = getInfographic(id);
  if (!infographic) return null;
  const applied = (infographic.history ?? []).slice(0, infographic.historyCursor ?? 0);
  const next: MockInfographic = {
    ...infographic,
    updatedAt: entry.createdAt,
    contents: withSnapshots(infographic, entry.after),
    history: [...applied, entry],
    historyCursor: applied.length + 1,
  };
  putInfographic(next);
  return next;
}

/** Undoes `entryId` (must be the latest applied entry) or redoes it (must be the next one). */
export function moveHistory(id: string, entryId: string, direction: "undo" | "redo"): MockInfographic | null {
  const infographic = getInfographic(id);
  if (!infographic) return null;
  const history = infographic.history ?? [];
  const cursor = infographic.historyCursor ?? 0;
  const index = direction === "undo" ? cursor - 1 : cursor;
  const entry = history[index];
  if (!entry || entry.id !== entryId) return null;
  const next: MockInfographic = {
    ...infographic,
    updatedAt: new Date().toISOString(),
    contents: withSnapshots(infographic, direction === "undo" ? entry.before : entry.after),
    historyCursor: direction === "undo" ? cursor - 1 : cursor + 1,
  };
  putInfographic(next);
  return next;
}

/**
 * Moves the cursor to `target` (0 = Original, n = after the n-th entry) by applying each undo or
 * redo in turn, so the same snapshots as the bar's undo/redo are used. Entries past `target`
 * stay in the list and remain redoable.
 */
export function jumpHistory(id: string, target: number): MockInfographic | null {
  const infographic = getInfographic(id);
  if (!infographic) return null;
  const history = infographic.history ?? [];
  const cursor = infographic.historyCursor ?? 0;
  if (!Number.isInteger(target) || target < 0 || target > history.length) return null;
  if (target === cursor) return infographic;
  let contents = infographic.contents;
  if (target < cursor) {
    for (let index = cursor - 1; index >= target; index--) {
      contents = withSnapshots({ ...infographic, contents }, history[index].before);
    }
  } else {
    for (let index = cursor; index < target; index++) {
      contents = withSnapshots({ ...infographic, contents }, history[index].after);
    }
  }
  const next: MockInfographic = {
    ...infographic,
    updatedAt: new Date().toISOString(),
    contents,
    historyCursor: target,
  };
  putInfographic(next);
  return next;
}

export function listBlockComments(id: string): MockComment[] {
  return [...(getInfographic(id)?.comments ?? [])];
}

export function appendComment(id: string, comment: MockComment): MockComment | null {
  const infographic = getInfographic(id);
  if (!infographic) return null;
  putInfographic({ ...infographic, comments: [...(infographic.comments ?? []), comment] });
  return comment;
}
