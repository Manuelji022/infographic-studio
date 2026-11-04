"use client";

import { useCallback, useRef, useState } from "react";
import type { ChatMessage, ChatOutcome, ChatRequest } from "./types";

function toMessage(id: string, request: ChatRequest, outcome: ChatOutcome): ChatMessage {
  if (outcome.type === "done") {
    return { id, role: "assistant", status: "done", entryId: outcome.entryId, blocks: outcome.blocks };
  }
  if (outcome.type === "notPossible") return { id, role: "assistant", status: "notPossible" };
  return { id, role: "assistant", status: "error", request };
}

/** In-memory conversation for one page load (mocks keep no chat on the server). */
export function useChat(run: (request: ChatRequest) => Promise<ChatOutcome>) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const counter = useRef(0);
  const busyRef = useRef(false);
  const [busy, setBusy] = useState(false);

  const execute = useCallback(
    async (assistantId: string, request: ChatRequest) => {
      busyRef.current = true;
      setBusy(true);
      let outcome: ChatOutcome;
      try {
        outcome = await run(request);
      } catch {
        outcome = { type: "error" };
      }
      setMessages((current) =>
        current.map((message) => (message.id === assistantId ? toMessage(assistantId, request, outcome) : message)),
      );
      busyRef.current = false;
      setBusy(false);
    },
    [run],
  );

  const send = useCallback(
    (request: ChatRequest) => {
      const instruction = request.instruction.trim();
      if (!instruction || busyRef.current) return;
      const n = ++counter.current;
      const assistantId = `a-${n}`;
      setMessages((current) => [
        ...current,
        { id: `u-${n}`, role: "user", text: instruction, block: request.block },
        { id: assistantId, role: "assistant", status: "pending" },
      ]);
      void execute(assistantId, { ...request, instruction });
    },
    [execute],
  );

  const retry = useCallback(
    (assistantId: string) => {
      if (busyRef.current) return;
      const target = messages.find((message) => message.id === assistantId);
      if (!target || target.role !== "assistant" || target.status !== "error") return;
      const request = target.request;
      setMessages((current) =>
        current.map((message) => (message.id === assistantId ? { id: assistantId, role: "assistant", status: "pending" } : message)),
      );
      void execute(assistantId, request);
    },
    [execute, messages],
  );

  return { messages, busy, send, retry };
}
