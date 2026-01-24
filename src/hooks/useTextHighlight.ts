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
      .from('highlights')
      .select('*')
      .eq('section_id', sectionId)
      .eq('student_id', user.id);
    
    if (data) {
      setHighlights(data.map(h => ({
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
      .from('highlights')
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
      setHighlights(prev => [...prev, {
        id: data.id,
        startIndex: data.start_index,
        endIndex: data.end_index,
        color: (data.color || 'yellow') as 'yellow' | 'green',
      }]);
    }
  }, [sectionId, user]);

  const removeHighlight = useCallback(async (id: string) => {
    await supabase.from('highlights').delete().eq('id', id);
    setHighlights(prev => prev.filter(h => h.id !== id));
  }, []);

  return {
    highlights,
    addHighlight,
    removeHighlight,
    loadHighlights,
  };
}
