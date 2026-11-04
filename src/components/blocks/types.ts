import type { BlockType } from "../../mocks/blocks";

/** A block of the infographic as the overlay needs it (from the server-side parse). */
export type BlockInfo = { id: string; type: BlockType; name: string; nested: boolean };

/** Box of a block in the overlay's coordinates (px, relative to the frame wrapper). */
export type Rect = { x: number; y: number; w: number; h: number };

export type BlockComment = { id: string; blockId: string; text: string; createdAt: string };
