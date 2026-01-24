-- Drop existing policy that exposes exam content
DROP POLICY IF EXISTS "Sections viewable with exam access" ON public.exam_sections;

-- Create new restrictive policy: only enrolled students with active submission, admins, or teachers can view
CREATE POLICY "Sections viewable by authorized users only" 
ON public.exam_sections 
FOR SELECT 
USING (
  -- Admins and teachers can always view
  has_role(auth.uid(), 'admin'::app_role) 
  OR has_role(auth.uid(), 'teacher'::app_role)
  OR (
    -- Students can only view if they are enrolled in the course AND have an active submission for this exam
    EXISTS (
      SELECT 1 
      FROM exams e
      JOIN enrollments en ON en.course_id = e.course_id
      JOIN exam_submissions es ON es.exam_id = e.id AND es.student_id = auth.uid()
      WHERE e.id = exam_sections.exam_id 
        AND en.student_id = auth.uid()
        AND e.is_published = true
    )
  )
);