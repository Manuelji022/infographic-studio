import type { BlockType } from "../../mocks/blocks";

/** A block the user picked in the infographic (U6 sets it; the chat only shows and clears it). */
export type SelectedBlock = { id: string; name: string; type: BlockType };

export type ChangedBlock = { id: string; name: string };

/** What the user asked for: the text plus the block it is scoped to, if any (D4). */
export type ChatRequest = {
  instruction: string;
  block: SelectedBlock | null;
  /** Regenerate: `instruction` is only the label shown in the chat; `rerun` is the block's last instruction, if any. */
  regenerate?: { rerun: string | null };
};

/** Result of running a request, already reduced to what the chat needs to render. */
export type ChatOutcome =
  | { type: "done"; entryId: string; blocks: ChangedBlock[] }
  | { type: "notPossible" }
  | { type: "error" };

export type ChatMessage =
  | { id: string; role: "user"; text: string; block: SelectedBlock | null }
  | { id: string; role: "assistant"; status: "pending" }
  | { id: string; role: "assistant"; status: "done"; entryId: string; blocks: ChangedBlock[] }
  | { id: string; role: "assistant"; status: "notPossible" }
  | { id: string; role: "assistant"; status: "error"; request: ChatRequest };
