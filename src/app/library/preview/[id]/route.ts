import type { NextRequest } from "next/server";
import { buildDocument } from "@ds/infographic/render";
import { parseLocale } from "../../../../lib/locale";
import { getInfographic } from "../../../../mocks/store";
import { displayContent } from "../../query";

const DS_VERSION = "1.0.0";

/**
 * Full document for one library thumbnail. Built on request, so only the iframes the
 * browser actually loads (lazy, near the viewport) cost any rendering work.
 */
export async function GET(request: NextRequest, ctx: RouteContext<"/library/preview/[id]">) {
  // Auth: the proxy guards /library/* (session cookie), like the page. Real session
  // validation belongs to the M3 backend, which replaces the mock store.
  const { id } = await ctx.params;
  const item = getInfographic(id);
  if (!item) return new Response("Not found", { status: 404 });

  const locale = parseLocale(request.nextUrl.searchParams.get("locale"));
  const content = displayContent(item, locale);
  if (!content) return new Response("Not found", { status: 404 });

  try {
    const doc = buildDocument(content.html, {
      locale: content.locale,
      theme: "auto",
      dsVersion: DS_VERSION,
      embed: true,
      title: content.title,
      charts: content.charts,
    });
    return new Response(doc, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return new Response("Preview unavailable", { status: 500 });
  }
}
