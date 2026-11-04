import { editBlock, editGlobal, type MockFlag } from "../../mocks/actions";
import type { Locale } from "../../mocks/types";
import type { ChatOutcome, ChatRequest } from "./types";

/**
 * Sends a request to the (mock) agent. Global requests call `editGlobal`; a request scoped to
 * a block (D4) calls `editBlock`, which changes that block only.
 */
export async function runChatRequest(
  context: { id: string; locale: Locale; mock?: MockFlag },
  request: ChatRequest,
): Promise<ChatOutcome> {
  try {
    const result = request.block
      ? await editBlock(
          context.id,
          context.locale,
          request.block.id,
          request.regenerate ? (request.regenerate.rerun ?? "") : request.instruction,
          context.mock,
          { regenerate: request.regenerate !== undefined },
        )
      : await editGlobal(context.id, context.locale, request.instruction, context.mock);
    if (!result.ok) return { type: "error" };
    if (result.data.notPossible) return { type: "notPossible" };
    return { type: "done", entryId: result.data.entry.id, blocks: result.data.changedBlocks };
  } catch {
    return { type: "error" };
  }
}
