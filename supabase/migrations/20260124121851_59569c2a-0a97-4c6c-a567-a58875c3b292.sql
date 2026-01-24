-- Drop the existing restrictive SELECT policy
DROP POLICY IF EXISTS "Users can view own enrollments" ON public.enrollments;

-- Create updated policy that includes teachers
CREATE POLICY "Users can view own enrollments or admins/teachers can view all"
ON public.enrollments
FOR SELECT
USING (
  (auth.uid() = student_id) 
  OR has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'teacher'::app_role)
);