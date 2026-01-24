-- Create enum types
CREATE TYPE public.app_role AS ENUM ('admin', 'teacher', 'student');
CREATE TYPE public.course_level AS ENUM ('beginner', 'intermediate', 'ielts_5', 'ielts_5_5', 'ielts_6', 'ielts_6_5', 'ielts_7', 'ielts_7_5', 'ielts_8', 'ielts_8_5', 'ielts_9');
CREATE TYPE public.exam_section_type AS ENUM ('listening', 'reading', 'writing', 'speaking');
CREATE TYPE public.question_type AS ENUM ('multiple_choice', 'fill_blank', 'matching', 'true_false_not_given', 'short_answer', 'essay', 'speaking_task');
CREATE TYPE public.submission_status AS ENUM ('in_progress', 'submitted', 'graded', 'pending_grading');

-- Profiles table (stores user info)
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    email TEXT NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    bio TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- User roles table (security definer pattern)
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL DEFAULT 'student',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (user_id, role)
);

-- Security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.user_roles
        WHERE user_id = _user_id
        AND role = _role
    )
$$;

-- Get current user's roles
CREATE OR REPLACE FUNCTION public.get_user_roles(_user_id UUID)
RETURNS SETOF app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT role FROM public.user_roles WHERE user_id = _user_id
$$;

-- Courses table
CREATE TABLE public.courses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    thumbnail_url TEXT,
    level course_level NOT NULL DEFAULT 'beginner',
    teacher_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    price DECIMAL(10,2) DEFAULT 0,
    is_published BOOLEAN DEFAULT false,
    syllabus JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Course enrollments
CREATE TABLE public.enrollments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE NOT NULL,
    student_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    enrolled_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    progress_percent INTEGER DEFAULT 0,
    UNIQUE (course_id, student_id)
);

-- Exams table
CREATE TABLE public.exams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    duration_minutes INTEGER DEFAULT 60,
    is_published BOOLEAN DEFAULT false,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Exam sections (Listening, Reading, Writing, Speaking)
CREATE TABLE public.exam_sections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    exam_id UUID REFERENCES public.exams(id) ON DELETE CASCADE NOT NULL,
    section_type exam_section_type NOT NULL,
    title TEXT NOT NULL,
    instructions TEXT,
    duration_minutes INTEGER,
    order_index INTEGER DEFAULT 0,
    audio_url TEXT, -- For listening sections
    passage_text TEXT, -- For reading sections
    prompt_text TEXT, -- For writing/speaking sections
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Question groups (for grouping questions in a section)
CREATE TABLE public.question_groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    section_id UUID REFERENCES public.exam_sections(id) ON DELETE CASCADE NOT NULL,
    title TEXT,
    instructions TEXT,
    audio_start_time INTEGER, -- Timestamp in seconds for listening
    audio_end_time INTEGER,
    passage_start_index INTEGER, -- For reading passage highlighting
    passage_end_index INTEGER,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Questions table
CREATE TABLE public.questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID REFERENCES public.question_groups(id) ON DELETE CASCADE NOT NULL,
    question_type question_type NOT NULL,
    question_text TEXT NOT NULL,
    options JSONB DEFAULT '[]'::jsonb, -- For multiple choice
    correct_answer TEXT, -- For auto-grading (listening/reading)
    points INTEGER DEFAULT 1,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Exam submissions (student attempts)
CREATE TABLE public.exam_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    exam_id UUID REFERENCES public.exams(id) ON DELETE CASCADE NOT NULL,
    student_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    status submission_status DEFAULT 'in_progress',
    started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    submitted_at TIMESTAMP WITH TIME ZONE,
    listening_score DECIMAL(3,1),
    reading_score DECIMAL(3,1),
    writing_score DECIMAL(3,1),
    speaking_score DECIMAL(3,1),
    overall_score DECIMAL(3,1),
    graded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    graded_at TIMESTAMP WITH TIME ZONE,
    feedback TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Individual question answers
CREATE TABLE public.answers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    submission_id UUID REFERENCES public.exam_submissions(id) ON DELETE CASCADE NOT NULL,
    question_id UUID REFERENCES public.questions(id) ON DELETE CASCADE NOT NULL,
    answer_text TEXT,
    answer_audio_url TEXT, -- For speaking answers
    is_correct BOOLEAN,
    points_earned INTEGER DEFAULT 0,
    teacher_feedback TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (submission_id, question_id)
);

-- Writing/Speaking task responses (longer form)
CREATE TABLE public.task_responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    submission_id UUID REFERENCES public.exam_submissions(id) ON DELETE CASCADE NOT NULL,
    section_id UUID REFERENCES public.exam_sections(id) ON DELETE CASCADE NOT NULL,
    response_text TEXT, -- For writing
    audio_url TEXT, -- For speaking
    word_count INTEGER,
    duration_seconds INTEGER,
    score DECIMAL(3,1),
    teacher_feedback TEXT,
    graded_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (submission_id, section_id)
);

-- User learning progress tracking
CREATE TABLE public.learning_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    total_exams_taken INTEGER DEFAULT 0,
    avg_listening_score DECIMAL(3,1),
    avg_reading_score DECIMAL(3,1),
    avg_writing_score DECIMAL(3,1),
    avg_speaking_score DECIMAL(3,1),
    avg_overall_score DECIMAL(3,1),
    last_exam_date TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (student_id)
);

-- Highlighted passages (for reading section)
CREATE TABLE public.highlights (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    section_id UUID REFERENCES public.exam_sections(id) ON DELETE CASCADE NOT NULL,
    start_index INTEGER NOT NULL,
    end_index INTEGER NOT NULL,
    color TEXT DEFAULT 'yellow',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Update timestamp trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Apply update triggers
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_courses_updated_at
    BEFORE UPDATE ON public.courses
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_exams_updated_at
    BEFORE UPDATE ON public.exams
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_learning_progress_updated_at
    BEFORE UPDATE ON public.learning_progress
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (user_id, email, full_name)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
    );
    
    -- Assign default student role
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'student');
    
    -- Initialize learning progress
    INSERT INTO public.learning_progress (student_id)
    VALUES (NEW.id);
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.question_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.highlights ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view all profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for user_roles (read-only for users, managed by admins/system)
CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage roles" ON public.user_roles FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for courses
CREATE POLICY "Anyone can view published courses" ON public.courses FOR SELECT USING (is_published = true);
CREATE POLICY "Teachers can view own courses" ON public.courses FOR SELECT USING (auth.uid() = teacher_id);
CREATE POLICY "Teachers can create courses" ON public.courses FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'teacher') OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Teachers can update own courses" ON public.courses FOR UPDATE USING (auth.uid() = teacher_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete courses" ON public.courses FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for enrollments
CREATE POLICY "Students can view own enrollments" ON public.enrollments FOR SELECT USING (auth.uid() = student_id);
CREATE POLICY "Teachers can view enrollments for their courses" ON public.enrollments FOR SELECT 
    USING (EXISTS (SELECT 1 FROM public.courses WHERE courses.id = enrollments.course_id AND courses.teacher_id = auth.uid()));
CREATE POLICY "Students can enroll themselves" ON public.enrollments FOR INSERT WITH CHECK (auth.uid() = student_id);
CREATE POLICY "Students can unenroll themselves" ON public.enrollments FOR DELETE USING (auth.uid() = student_id);

-- RLS Policies for exams
CREATE POLICY "Anyone can view published exams" ON public.exams FOR SELECT USING (is_published = true);
CREATE POLICY "Teachers can view own exams" ON public.exams FOR SELECT USING (auth.uid() = created_by);
CREATE POLICY "Teachers can create exams" ON public.exams FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'teacher') OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Teachers can update own exams" ON public.exams FOR UPDATE USING (auth.uid() = created_by OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete exams" ON public.exams FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for exam_sections
CREATE POLICY "View sections of viewable exams" ON public.exam_sections FOR SELECT 
    USING (EXISTS (SELECT 1 FROM public.exams WHERE exams.id = exam_sections.exam_id AND (exams.is_published = true OR exams.created_by = auth.uid())));
CREATE POLICY "Teachers can manage sections" ON public.exam_sections FOR ALL 
    USING (EXISTS (SELECT 1 FROM public.exams WHERE exams.id = exam_sections.exam_id AND exams.created_by = auth.uid()));

-- RLS Policies for question_groups
CREATE POLICY "View groups of viewable sections" ON public.question_groups FOR SELECT 
    USING (EXISTS (
        SELECT 1 FROM public.exam_sections es 
        JOIN public.exams e ON es.exam_id = e.id 
        WHERE es.id = question_groups.section_id AND (e.is_published = true OR e.created_by = auth.uid())
    ));
CREATE POLICY "Teachers can manage groups" ON public.question_groups FOR ALL 
    USING (EXISTS (
        SELECT 1 FROM public.exam_sections es 
        JOIN public.exams e ON es.exam_id = e.id 
        WHERE es.id = question_groups.section_id AND e.created_by = auth.uid()
    ));

-- RLS Policies for questions
CREATE POLICY "View questions of viewable groups" ON public.questions FOR SELECT 
    USING (EXISTS (
        SELECT 1 FROM public.question_groups qg
        JOIN public.exam_sections es ON qg.section_id = es.id
        JOIN public.exams e ON es.exam_id = e.id
        WHERE qg.id = questions.group_id AND (e.is_published = true OR e.created_by = auth.uid())
    ));
CREATE POLICY "Teachers can manage questions" ON public.questions FOR ALL 
    USING (EXISTS (
        SELECT 1 FROM public.question_groups qg
        JOIN public.exam_sections es ON qg.section_id = es.id
        JOIN public.exams e ON es.exam_id = e.id
        WHERE qg.id = questions.group_id AND e.created_by = auth.uid()
    ));

-- RLS Policies for exam_submissions
CREATE POLICY "Students can view own submissions" ON public.exam_submissions FOR SELECT USING (auth.uid() = student_id);
CREATE POLICY "Teachers can view submissions for their exams" ON public.exam_submissions FOR SELECT 
    USING (EXISTS (SELECT 1 FROM public.exams WHERE exams.id = exam_submissions.exam_id AND exams.created_by = auth.uid()));
CREATE POLICY "Students can create submissions" ON public.exam_submissions FOR INSERT WITH CHECK (auth.uid() = student_id);
CREATE POLICY "Students can update own submissions" ON public.exam_submissions FOR UPDATE USING (auth.uid() = student_id AND status = 'in_progress');
CREATE POLICY "Teachers can grade submissions" ON public.exam_submissions FOR UPDATE 
    USING (EXISTS (SELECT 1 FROM public.exams WHERE exams.id = exam_submissions.exam_id AND exams.created_by = auth.uid()));

-- RLS Policies for answers
CREATE POLICY "Students can view own answers" ON public.answers FOR SELECT 
    USING (EXISTS (SELECT 1 FROM public.exam_submissions WHERE exam_submissions.id = answers.submission_id AND exam_submissions.student_id = auth.uid()));
CREATE POLICY "Teachers can view answers for their exams" ON public.answers FOR SELECT 
    USING (EXISTS (
        SELECT 1 FROM public.exam_submissions es
        JOIN public.exams e ON es.exam_id = e.id
        WHERE es.id = answers.submission_id AND e.created_by = auth.uid()
    ));
CREATE POLICY "Students can insert answers" ON public.answers FOR INSERT 
    WITH CHECK (EXISTS (SELECT 1 FROM public.exam_submissions WHERE exam_submissions.id = answers.submission_id AND exam_submissions.student_id = auth.uid() AND exam_submissions.status = 'in_progress'));
CREATE POLICY "Students can update own answers" ON public.answers FOR UPDATE 
    USING (EXISTS (SELECT 1 FROM public.exam_submissions WHERE exam_submissions.id = answers.submission_id AND exam_submissions.student_id = auth.uid() AND exam_submissions.status = 'in_progress'));
CREATE POLICY "Teachers can update answers for grading" ON public.answers FOR UPDATE 
    USING (EXISTS (
        SELECT 1 FROM public.exam_submissions es
        JOIN public.exams e ON es.exam_id = e.id
        WHERE es.id = answers.submission_id AND e.created_by = auth.uid()
    ));

-- RLS Policies for task_responses
CREATE POLICY "Students can view own task responses" ON public.task_responses FOR SELECT 
    USING (EXISTS (SELECT 1 FROM public.exam_submissions WHERE exam_submissions.id = task_responses.submission_id AND exam_submissions.student_id = auth.uid()));
CREATE POLICY "Teachers can view task responses for their exams" ON public.task_responses FOR SELECT 
    USING (EXISTS (
        SELECT 1 FROM public.exam_submissions es
        JOIN public.exams e ON es.exam_id = e.id
        WHERE es.id = task_responses.submission_id AND e.created_by = auth.uid()
    ));
CREATE POLICY "Students can insert task responses" ON public.task_responses FOR INSERT 
    WITH CHECK (EXISTS (SELECT 1 FROM public.exam_submissions WHERE exam_submissions.id = task_responses.submission_id AND exam_submissions.student_id = auth.uid() AND exam_submissions.status = 'in_progress'));
CREATE POLICY "Students can update own task responses" ON public.task_responses FOR UPDATE 
    USING (EXISTS (SELECT 1 FROM public.exam_submissions WHERE exam_submissions.id = task_responses.submission_id AND exam_submissions.student_id = auth.uid() AND exam_submissions.status = 'in_progress'));
CREATE POLICY "Teachers can update task responses for grading" ON public.task_responses FOR UPDATE 
    USING (EXISTS (
        SELECT 1 FROM public.exam_submissions es
        JOIN public.exams e ON es.exam_id = e.id
        WHERE es.id = task_responses.submission_id AND e.created_by = auth.uid()
    ));

-- RLS Policies for learning_progress
CREATE POLICY "Students can view own progress" ON public.learning_progress FOR SELECT USING (auth.uid() = student_id);
CREATE POLICY "System can update progress" ON public.learning_progress FOR UPDATE USING (auth.uid() = student_id);

-- RLS Policies for highlights
CREATE POLICY "Students can view own highlights" ON public.highlights FOR SELECT USING (auth.uid() = student_id);
CREATE POLICY "Students can create highlights" ON public.highlights FOR INSERT WITH CHECK (auth.uid() = student_id);
CREATE POLICY "Students can delete own highlights" ON public.highlights FOR DELETE USING (auth.uid() = student_id);

-- Create indexes for performance
CREATE INDEX idx_courses_teacher ON public.courses(teacher_id);
CREATE INDEX idx_courses_level ON public.courses(level);
CREATE INDEX idx_enrollments_student ON public.enrollments(student_id);
CREATE INDEX idx_enrollments_course ON public.enrollments(course_id);
CREATE INDEX idx_exams_course ON public.exams(course_id);
CREATE INDEX idx_exam_sections_exam ON public.exam_sections(exam_id);
CREATE INDEX idx_question_groups_section ON public.question_groups(section_id);
CREATE INDEX idx_questions_group ON public.questions(group_id);
CREATE INDEX idx_exam_submissions_student ON public.exam_submissions(student_id);
CREATE INDEX idx_exam_submissions_exam ON public.exam_submissions(exam_id);
CREATE INDEX idx_answers_submission ON public.answers(submission_id);
CREATE INDEX idx_task_responses_submission ON public.task_responses(submission_id);