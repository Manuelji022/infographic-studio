"use client";

import { createContext } from "react";

/**
 * What the block layer needs from the frame: the iframe (same-origin, no scripts, so the parent
 * reads its document directly), the wrapper the overlay is positioned in, and a counter that
 * grows every time the document loads, is patched or resizes (a cue to measure again).
 */
export type FrameContextValue = { iframe: HTMLIFrameElement | null; frame: HTMLElement | null; revision: number };

export const FrameContext = createContext<FrameContextValue>({ iframe: null, frame: null, revision: 0 });
