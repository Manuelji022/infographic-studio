import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import type { Locale } from "../../../../messages";
import { lookupSharedToken } from "../../../mocks/store";
import { renderDocument, resolveContent } from "../../../components/workspace/render-document";
import { SharedView } from "../../../components/workspace/SharedView";

const isLocale = (value: unknown): value is Locale => value === "es" || value === "en";

/**
 * First supported language by quality (RFC 9110): q=0 means "not acceptable", missing q means 1,
 * ties keep the header order, and only the primary subtag matters (en-GB -> en).
 */
function fromAcceptLanguage(header: string | null): Locale | null {
  const ranked = (header ?? "")
    .split(",")
    .map((part, index) => {
      const [range, ...params] = part.split(";").map((item) => item.trim());
      const qParam = params.find((item) => /^q=/i.test(item));
      // RFC 9110 weight: 0..1 with up to 3 decimals; anything else is malformed -> not acceptable.
      const raw = qParam === undefined ? "1" : qParam.slice(2);
      const quality = /^(0(\.\d{0,3})?|1(\.0{0,3})?)$/.test(raw) ? Number(raw) : 0;
      const primary = (range ?? "").toLowerCase().split("-")[0];
      return { primary, quality, index };
    })
    .filter((entry) => entry.quality > 0);
  // Explicitly excluded (q=0) languages must not come back through a wildcard.
  const excluded = new Set(
    (header ?? "")
      .split(",")
      .map((part) => part.split(";").map((item) => item.trim()))
      .filter(([, ...params]) => params.some((item) => /^q=0(\.0{0,3})?$/i.test(item)))
      .map(([range]) => (range ?? "").toLowerCase().split("-")[0]),
  );
  const sorted = ranked.sort((a, b) => b.quality - a.quality || a.index - b.index);
  for (const entry of sorted) {
    if (isLocale(entry.primary)) return entry.primary;
    if (entry.primary === "*") {
      const allowed = (["es", "en"] as const).find((locale) => !excluded.has(locale));
      if (allowed) return allowed;
    }
  }
  return null;
}

async function load(params: PageProps<"/s/[token]">["params"], searchParams: PageProps<"/s/[token]">["searchParams"]) {
  const { token } = await params;
  const found = lookupSharedToken(token);
  if (!found.found) return null;
  const { infographic, link } = found;
  const lang = (await searchParams).lang;
  const requested = isLocale(lang) ? lang : null;
  const preferred =
    requested ?? link.defaultLocale ?? fromAcceptLanguage((await headers()).get("accept-language")) ?? "es";
  const { content } = resolveContent(infographic, preferred);
  if (!content) return null;
  return { infographic, link, content };
}

export async function generateMetadata({ params, searchParams }: PageProps<"/s/[token]">): Promise<Metadata> {
  const data = await load(params, searchParams);
  if (!data) return { robots: { index: false, follow: false }, referrer: "no-referrer" };
  return {
    title: data.content.title,
    description: data.content.summary,
    robots: { index: false, follow: false },
    referrer: "no-referrer",
    openGraph: { title: data.content.title, description: data.content.summary },
  };
}

export default async function SharedPage({ params, searchParams }: PageProps<"/s/[token]">) {
  const data = await load(params, searchParams);
  if (!data) notFound();
  const { infographic, content } = data;
  return (
    <SharedView
      locale={content.locale}
      title={content.title}
      srcDoc={renderDocument(content, { theme: "auto", embed: true })}
      locales={(["es", "en"] as const).filter((l) => infographic.contents[l])}
      sourceUrl={infographic.sourceUrl}
    />
  );
}
