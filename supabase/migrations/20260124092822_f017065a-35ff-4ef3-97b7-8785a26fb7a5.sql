-- Create exam_section_type enum
CREATE TYPE public.exam_section_type AS ENUM ('listening', 'reading', 'writing', 'speaking');

-- Create question_type enum  
CREATE TYPE public.question_type AS ENUM ('multiple_choice', 'fill_blank', 'matching', 'essay', 'speaking');

-- Create submission_status enum
CREATE TYPE public.submission_status AS ENUM ('in_progress', 'submitted', 'graded');

-- Create exams table
CREATE TABLE public.exams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  week INTEGER DEFAULT 1,
  duration_minutes INTEGER DEFAULT 60,
  is_published BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Create exam_sections table
CREATE TABLE public.exam_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id UUID REFERENCES public.exams(id) ON DELETE CASCADE NOT NULL,
  section_type exam_section_type NOT NULL,
  title TEXT NOT NULL,
  instructions TEXT,
  content JSONB DEFAULT '[]'::jsonb,
  audio_url TEXT,
  duration_minutes INTEGER,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Create question_groups table
CREATE TABLE public.question_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section_id UUID REFERENCES public.exam_sections(id) ON DELETE CASCADE NOT NULL,
  title TEXT,
  instructions TEXT,
  passage TEXT,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Create questions table
CREATE TABLE public.questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID REFERENCES public.question_groups(id) ON DELETE CASCADE NOT NULL,
  question_type question_type NOT NULL,
  question_text TEXT NOT NULL,
  options JSONB,
  correct_answer TEXT,
  points INTEGER DEFAULT 1,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Create exam_submissions table
CREATE TABLE public.exam_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id UUID REFERENCES public.exams(id) ON DELETE CASCADE NOT NULL,
  student_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  status submission_status DEFAULT 'in_progress',
  started_at TIMESTAMPTZ DEFAULT now(),
  submitted_at TIMESTAMPTZ,
  total_score NUMERIC,
  graded_by UUID,
  graded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Create answers table
CREATE TABLE public.answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id UUID REFERENCES public.exam_submissions(id) ON DELETE CASCADE NOT NULL,
  question_id UUID REFERENCES public.questions(id) ON DELETE CASCADE NOT NULL,
  answer_text TEXT,
  audio_url TEXT,
  score NUMERIC,
  feedback TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Create highlights table for reading section
CREATE TABLE public.highlights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section_id UUID REFERENCES public.exam_sections(id) ON DELETE CASCADE NOT NULL,
  student_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  start_index INTEGER NOT NULL,
  end_index INTEGER NOT NULL,
  color TEXT DEFAULT 'yellow',
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Enable RLS on all tables
ALTER TABLE public.exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.question_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.highlights ENABLE ROW LEVEL SECURITY;

-- Exams policies
CREATE POLICY "Published exams viewable by enrolled students" ON public.exams
  FOR SELECT USING (
    is_published = true OR 
    has_role(auth.uid(), 'admin') OR 
    has_role(auth.uid(), 'teacher')
  );

CREATE POLICY "Admins and teachers can manage exams" ON public.exams
  FOR ALL USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'teacher'));

-- Exam sections policies
CREATE POLICY "Sections viewable with exam access" ON public.exam_sections
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.exams WHERE id = exam_id AND (is_published = true OR has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'teacher')))
  );

CREATE POLICY "Admins and teachers can manage sections" ON public.exam_sections
  FOR ALL USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'teacher'));

-- Question groups policies
CREATE POLICY "Groups viewable with section access" ON public.question_groups
  FOR SELECT USING (true);

CREATE POLICY "Admins and teachers can manage groups" ON public.question_groups
  FOR ALL USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'teacher'));

-- Questions policies
CREATE POLICY "Questions viewable by all" ON public.questions
  FOR SELECT USING (true);

CREATE POLICY "Admins and teachers can manage questions" ON public.questions
  FOR ALL USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'teacher'));

-- Exam submissions policies
CREATE POLICY "Students can view own submissions" ON public.exam_submissions
  FOR SELECT USING (student_id = auth.uid() OR has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'teacher'));

CREATE POLICY "Students can create own submissions" ON public.exam_submissions
  FOR INSERT WITH CHECK (student_id = auth.uid());

CREATE POLICY "Students can update own in-progress submissions" ON public.exam_submissions
  FOR UPDATE USING (student_id = auth.uid() AND status = 'in_progress');

CREATE POLICY "Admins and teachers can manage submissions" ON public.exam_submissions
  FOR ALL USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'teacher'));

-- Answers policies
CREATE POLICY "Students can view own answers" ON public.answers
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.exam_submissions WHERE id = submission_id AND student_id = auth.uid())
    OR has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'teacher')
  );

CREATE POLICY "Students can manage own answers" ON public.answers
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.exam_submissions WHERE id = submission_id AND student_id = auth.uid() AND status = 'in_progress')
  );

CREATE POLICY "Admins and teachers can manage answers" ON public.answers
  FOR ALL USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'teacher'));

-- Highlights policies
CREATE POLICY "Students can manage own highlights" ON public.highlights
  FOR ALL USING (student_id = auth.uid());

-- Triggers for updated_at
CREATE TRIGGER update_exams_updated_at BEFORE UPDATE ON public.exams
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_exam_sections_updated_at BEFORE UPDATE ON public.exam_sections
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_answers_updated_at BEFORE UPDATE ON public.answers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();