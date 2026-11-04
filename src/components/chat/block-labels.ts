import type { Messages } from "../../../messages";
import type { BlockType } from "../../mocks/blocks";

/** Localised name of a block kind ("Chart", "Section"…). */
export function blockTypeLabel(messages: Messages, type: BlockType): string {
  const labels: Record<BlockType, string> = {
    header: messages.blockTypeHeader,
    section: messages.blockTypeSection,
    chart: messages.blockTypeChart,
    stat: messages.blockTypeStat,
    quote: messages.blockTypeQuote,
    timeline: messages.blockTypeTimeline,
    callout: messages.blockTypeCallout,
    verdict: messages.blockTypeVerdict,
    footer: messages.blockTypeFooter,
    text: messages.blockTypeText,
  };
  return labels[type];
}
