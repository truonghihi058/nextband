import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface Highlight {
  id: string;
  startIndex: number;
  endIndex: number;
  color: 'yellow' | 'green';
}

interface UseTextHighlightReturn {
  highlights: Highlight[];
  addHighlight: (startIndex: number, endIndex: number, color: 'yellow' | 'green') => Promise<void>;
  removeHighlight: (id: string) => Promise<void>;
  loadHighlights: (sectionId: string) => Promise<void>;
}

export function useTextHighlight(sectionId: string): UseTextHighlightReturn {
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const { user } = useAuth();

  const loadHighlights = useCallback(async (sectionId: string) => {
    if (!user) return;
    
    const { data } = await supabase
      .from('highlights' as any)
      .select('*')
      .eq('section_id', sectionId)
      .eq('student_id', user.id);
    
    if (data) {
      setHighlights((data as any[]).map(h => ({
        id: h.id,
        startIndex: h.start_index,
        endIndex: h.end_index,
        color: (h.color || 'yellow') as 'yellow' | 'green',
      })));
    }
  }, [user]);

  const addHighlight = useCallback(async (startIndex: number, endIndex: number, color: 'yellow' | 'green') => {
    if (!user) return;

    const { data, error } = await supabase
      .from('highlights' as any)
      .insert({
        section_id: sectionId,
        student_id: user.id,
        start_index: startIndex,
        end_index: endIndex,
        color,
      })
      .select()
      .single();

    if (data && !error) {
      const record = data as any;
      setHighlights(prev => [...prev, {
        id: record.id,
        startIndex: record.start_index,
        endIndex: record.end_index,
        color: (record.color || 'yellow') as 'yellow' | 'green',
      }]);
    }
  }, [sectionId, user]);

  const removeHighlight = useCallback(async (id: string) => {
    await supabase.from('highlights' as any).delete().eq('id', id);
    setHighlights(prev => prev.filter(h => h.id !== id));
  }, []);

  return {
    highlights,
    addHighlight,
    removeHighlight,
    loadHighlights,
  };
}
