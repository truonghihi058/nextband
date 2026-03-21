import { useState, useCallback, useMemo } from "react";
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
  updateHighlightColor: (
    id: string,
    color: "yellow" | "green",
  ) => Promise<void>;
  loadHighlights: (sectionId: string) => Promise<void>;
}

export function useTextHighlight(sectionId: string): UseTextHighlightReturn {
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const { user } = useAuth();
  const cacheKey = useMemo(
    () => `reading_highlights:${user?.id || "anon"}:${sectionId || "none"}`,
    [user?.id, sectionId],
  );

  const persistLocalCache = useCallback(
    (nextHighlights: Highlight[]) => {
      try {
        sessionStorage.setItem(cacheKey, JSON.stringify(nextHighlights));
      } catch {
        // Ignore storage errors (private mode/full storage).
      }
    },
    [cacheKey],
  );

  const loadHighlights = useCallback(
    async (sectionId: string) => {
      if (!user) return;

      // Warm start from session cache to keep UI stable while network fetches.
      try {
        const cached = sessionStorage.getItem(cacheKey);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed)) {
            setHighlights(parsed);
          }
        }
      } catch {
        // Ignore malformed cache.
      }

      try {
        const { data } = await api.get(`/highlights`, {
          params: { sectionId },
        });
        if (data?.data) {
          const normalized = data.data.map((h: any) => ({
              id: h.id,
              startIndex: h.startIndex,
              endIndex: h.endIndex,
              color: (h.color || "yellow") as "yellow" | "green",
            }));
          setHighlights(normalized);
          persistLocalCache(normalized);
        }
      } catch (error) {
        console.error("Failed to load highlights:", error);
      }
    },
    [cacheKey, persistLocalCache, user],
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
          setHighlights((prev) => {
            const next = [
            ...prev,
            {
              id: data.id,
              startIndex: data.startIndex,
              endIndex: data.endIndex,
              color: (data.color || "yellow") as "yellow" | "green",
            },
            ];
            persistLocalCache(next);
            return next;
          });
        }
      } catch (error) {
        console.error("Failed to add highlight:", error);
      }
    },
    [persistLocalCache, sectionId, user],
  );

  const removeHighlight = useCallback(async (id: string) => {
    try {
      await api.delete(`/highlights/${id}`);
      setHighlights((prev) => {
        const next = prev.filter((h) => h.id !== id);
        persistLocalCache(next);
        return next;
      });
    } catch (error) {
      console.error("Failed to remove highlight:", error);
    }
  }, [persistLocalCache]);

  const updateHighlightColor = useCallback(
    async (id: string, color: "yellow" | "green") => {
      try {
        await api.patch(`/highlights/${id}`, { color });
        setHighlights((prev) => {
          const next = prev.map((h) => (h.id === id ? { ...h, color } : h));
          persistLocalCache(next);
          return next;
        });
      } catch (error) {
        console.error("Failed to update highlight color:", error);
      }
    },
    [persistLocalCache],
  );

  return {
    highlights,
    addHighlight,
    removeHighlight,
    updateHighlightColor,
    loadHighlights,
  };
}
