import { useState, useCallback } from "react";

export interface Highlight {
  id: string;
  passageId?: string | null;
  highlightText?: string | null;
  startIndex: number;
  endIndex: number;
  color: "yellow" | "green";
  createdAt?: string;
  updatedAt?: string;
}

interface UseTextHighlightReturn {
  highlights: Highlight[];
  addHighlight: (payload: {
    startIndex: number;
    endIndex: number;
    color: "yellow" | "green";
    highlightText?: string;
    passageId?: string;
  }) => Promise<void>;
  removeHighlight: (id: string) => Promise<void>;
  updateHighlightColor: (
    id: string,
    color: "yellow" | "green",
  ) => Promise<void>;
  loadHighlights: (_sectionId: string) => Promise<void>;
}

const createClientId = () => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `hl_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
};

// MVP: highlights are temporary and only live in memory during exam session.
export function useTextHighlight(_sectionId: string): UseTextHighlightReturn {
  const [highlights, setHighlights] = useState<Highlight[]>([]);

  const loadHighlights = useCallback(async (_sectionId: string) => {
    // Intentionally no-op: no backend/database persistence for temporary mode.
  }, []);

  const addHighlight = useCallback(
    async ({
      startIndex,
      endIndex,
      color,
      highlightText,
      passageId,
    }: {
      startIndex: number;
      endIndex: number;
      color: "yellow" | "green";
      highlightText?: string;
      passageId?: string;
    }) => {
      setHighlights((prev) => [
        ...prev,
        {
          id: createClientId(),
          passageId: passageId || null,
          highlightText: highlightText || null,
          startIndex,
          endIndex,
          color,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ]);
    },
    [],
  );

  const removeHighlight = useCallback(async (id: string) => {
    setHighlights((prev) => prev.filter((h) => h.id !== id));
  }, []);

  const updateHighlightColor = useCallback(
    async (id: string, color: "yellow" | "green") => {
      setHighlights((prev) =>
        prev.map((h) =>
          h.id === id ? { ...h, color, updatedAt: new Date().toISOString() } : h,
        ),
      );
    },
    [],
  );

  return {
    highlights,
    addHighlight,
    removeHighlight,
    updateHighlightColor,
    loadHighlights,
  };
}
