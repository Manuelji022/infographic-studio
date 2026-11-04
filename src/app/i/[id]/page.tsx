import type { Metadata } from "next";
import { cookies } from "next/headers";
import { connection } from "next/server";
import { notFound } from "next/navigation";
import { LOCALE_COOKIE, parseLocale } from "../../../lib/locale";
import type { MockFlag } from "../../../mocks/actions";
import { parseBlocks } from "../../../mocks/blocks";
import { getInfographic, historyView, isLinkActive } from "../../../mocks/store";
import { renderDocument, resolveContent } from "../../../components/workspace/render-document";
import { WorkspaceView } from "../../../components/workspace/WorkspaceView";

async function load(id: string) {
  const item = getInfographic(id);
  if (!item) return null;
  const locale = parseLocale((await cookies()).get(LOCALE_COOKIE)?.value);
  const { content, missing } = resolveContent(item, locale);
  if (!content) return null;
  return { item, locale, content, missing };
}

export async function generateMetadata({ params }: PageProps<"/i/[id]">): Promise<Metadata> {
  const data = await load((await params).id);
  return { title: data?.content.title, robots: { index: false, follow: false } };
}

export default async function InfographicPage({ params, searchParams }: PageProps<"/i/[id]">) {
  const [{ id }, { mock, select }] = await Promise.all([params, searchParams]);
  const data = await load(id);
  if (!data) notFound();
  await connection(); // link expiry reads the clock: render per request
  const { item, locale, content, missing } = data;
  const flag = mock === "error" || mock === "slow" ? (mock satisfies MockFlag) : undefined;
  // `?select=<block id>` opens the workspace with that block selected (preview of U6's selection).
  const picked = typeof select === "string" ? parseBlocks(content.html, { charts: content.charts }).find((block) => block.id === select) : undefined;
  const pickedId = picked?.id ?? null;
  const blocks = parseBlocks(content.html, { charts: content.charts })
    .filter((block) => block.id && !block.opaque)
    .map((block) => ({ id: block.id!, type: block.type, name: block.name, nested: block.nested }));
  return (
    <WorkspaceView
      id={item.id}
      locale={locale}
      contentLocale={content.locale}
      missingLocale={missing}
      title={content.title}
      srcDoc={renderDocument(content, { theme: "auto", embed: true })}
      sourceText={item.sourceText}
      link={isLinkActive(item.share) ? item.share : null}
      history={historyView(item)}
      blocks={blocks}
      comments={item.comments ?? []}
      mock={flag}
      initialSelectedBlock={picked && pickedId ? { id: pickedId, name: picked.name, type: picked.type } : null}
    />
  );
}
