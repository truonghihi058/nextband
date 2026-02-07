
-- Drop existing FK pointing to auth.users
ALTER TABLE public.exam_submissions DROP CONSTRAINT exam_submissions_student_id_fkey;

-- Recreate FK pointing to profiles.user_id
ALTER TABLE public.exam_submissions 
ADD CONSTRAINT exam_submissions_student_id_profiles_fkey 
FOREIGN KEY (student_id) REFERENCES public.profiles(user_id);

-- Refresh PostgREST schema cache
NOTIFY pgrst, 'reload schema';
