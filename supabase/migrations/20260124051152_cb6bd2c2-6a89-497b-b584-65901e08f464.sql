-- Add week field to exams for sorting within courses
ALTER TABLE public.exams ADD COLUMN week integer DEFAULT 1;

-- Add is_active field to exams for soft-disable
ALTER TABLE public.exams ADD COLUMN is_active boolean DEFAULT true;

-- Add is_active field to courses for soft-disable
ALTER TABLE public.courses ADD COLUMN is_active boolean DEFAULT true;

-- Add is_active field to profiles for soft-disable users
ALTER TABLE public.profiles ADD COLUMN is_active boolean DEFAULT true;

-- Create index for better query performance
CREATE INDEX idx_exams_week ON public.exams(course_id, week);
CREATE INDEX idx_exams_is_active ON public.exams(is_active);
CREATE INDEX idx_courses_is_active ON public.courses(is_active);
CREATE INDEX idx_profiles_is_active ON public.profiles(is_active);