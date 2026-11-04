import type { Messages } from "../../messages";
import type { ContentTypeId } from "./types";

/**
 * Single source for the content-type selector. Adding a type means adding an entry here
 * plus its two message keys; no component changes.
 */
export const CONTENT_TYPES: ReadonlyArray<{
  id: ContentTypeId;
  labelKey: keyof Messages;
  descriptionKey: keyof Messages;
}> = [
  { id: "auto", labelKey: "contentTypeAuto", descriptionKey: "contentTypeAutoDescription" },
  {
    id: "interview",
    labelKey: "contentTypeInterview",
    descriptionKey: "contentTypeInterviewDescription",
  },
  { id: "article", labelKey: "contentTypeArticle", descriptionKey: "contentTypeArticleDescription" },
  {
    id: "financial",
    labelKey: "contentTypeFinancial",
    descriptionKey: "contentTypeFinancialDescription",
  },
];

export const DEFAULT_CONTENT_TYPE: ContentTypeId = "auto";
export const SOFT_CHAR_LIMIT = 30_000;
