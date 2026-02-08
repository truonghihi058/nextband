import { useState, useCallback } from "react";
import api from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";

export interface Highlight {
  id: string;
  startIndex: number;
  endIndex: number;
  color: "yellow" | "green";
}

interface UseTextHighlightReturn {
  highlights: Highlight[];
  addHighlight: (
    startIndex: number,
    endIndex: number,
    color: "yellow" | "green",
  ) => Promise<void>;
  removeHighlight: (id: string) => Promise<void>;
  loadHighlights: (sectionId: string) => Promise<void>;
}

export function useTextHighlight(sectionId: string): UseTextHighlightReturn {
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const { user } = useAuth();

  const loadHighlights = useCallback(
    async (sectionId: string) => {
      if (!user) return;

      try {
        const { data } = await api.get(`/highlights`, {
          params: { sectionId },
        });
        if (data?.data) {
          setHighlights(
            data.data.map((h: any) => ({
              id: h.id,
              startIndex: h.startIndex,
              endIndex: h.endIndex,
              color: (h.color || "yellow") as "yellow" | "green",
            })),
          );
        }
      } catch (error) {
        console.error("Failed to load highlights:", error);
      }
    },
    [user],
  );

  const addHighlight = useCallback(
    async (startIndex: number, endIndex: number, color: "yellow" | "green") => {
      if (!user) return;

      try {
        const { data } = await api.post("/highlights", {
          sectionId,
          startIndex,
          endIndex,
          color,
        });

        if (data) {
          setHighlights((prev) => [
            ...prev,
            {
              id: data.id,
              startIndex: data.startIndex,
              endIndex: data.endIndex,
              color: (data.color || "yellow") as "yellow" | "green",
            },
          ]);
        }
      } catch (error) {
        console.error("Failed to add highlight:", error);
      }
    },
    [sectionId, user],
  );

  const removeHighlight = useCallback(async (id: string) => {
    try {
      await api.delete(`/highlights/${id}`);
      setHighlights((prev) => prev.filter((h) => h.id !== id));
    } catch (error) {
      console.error("Failed to remove highlight:", error);
    }
  }, []);

  return {
    highlights,
    addHighlight,
    removeHighlight,
    loadHighlights,
  };
}
