import type { NextRequest } from "next/server";
import { LOCALE_COOKIE, parseLocale } from "../../../../lib/locale";
import { getInfographic } from "../../../../mocks/store";
import { renderDocument, resolveContent } from "../../../../components/workspace/render-document";

/**
 * Self-contained .html (fonts inlined, standalone CSP). Session protected by the proxy,
 * like the page. `?inline=1` returns it without Content-Disposition (Copy HTML uses it).
 */
export async function GET(request: NextRequest, ctx: RouteContext<"/i/[id]/download">) {
  const { id } = await ctx.params;
  const item = getInfographic(id);
  if (!item) return new Response("Not found", { status: 404 });

  const params = request.nextUrl.searchParams;
  const locale = parseLocale(params.get("locale") ?? request.cookies.get(LOCALE_COOKIE)?.value);
  const themeParam = params.get("theme");
  const theme = themeParam === "light" || themeParam === "dark" ? themeParam : "auto";
  const { content } = resolveContent(item, locale);
  if (!content) return new Response("Not found", { status: 404 });

  const slug =
    content.title
      .normalize("NFD")
      .replace(/\p{M}+/gu, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "infographic";

  try {
    const doc = renderDocument(content, { theme, embed: false });
    const headers: Record<string, string> = {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    };
    if (params.get("inline") !== "1") {
      headers["Content-Disposition"] = `attachment; filename="${slug}.${content.locale}.html"`;
    }
    return new Response(doc, { headers });
  } catch (error) {
    console.error("download: could not render the document", error);
    return new Response("Document unavailable", { status: 500 });
  }
}
