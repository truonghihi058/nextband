-- Add exam_type column to exams table for IELTS vs GRAMMAR differentiation
ALTER TABLE public.exams 
ADD COLUMN IF NOT EXISTS exam_type TEXT NOT NULL DEFAULT 'ielts' 
CHECK (exam_type IN ('ielts', 'grammar'));

-- Add comment for clarity
COMMENT ON COLUMN public.exams.exam_type IS 'Type of exam: ielts (4 skills) or grammar (single general section)';