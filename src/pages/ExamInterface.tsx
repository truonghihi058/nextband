import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { 
  ArrowLeft, 
  Clock, 
  Headphones, 
  BookOpen, 
  PenTool, 
  Mic,
  ChevronLeft,
  ChevronRight,
  Send
} from 'lucide-react';
import { ListeningSection } from '@/components/exam/ListeningSection';
import { ReadingSection } from '@/components/exam/ReadingSection';
import { WritingSection } from '@/components/exam/WritingSection';
import { SpeakingSection } from '@/components/exam/SpeakingSection';
import { ExamTimer } from '@/components/exam/ExamTimer';

type SectionType = 'listening' | 'reading' | 'writing' | 'speaking';

const sectionIcons = {
  listening: Headphones,
  reading: BookOpen,
  writing: PenTool,
  speaking: Mic,
};

const sectionLabels = {
  listening: 'Listening',
  reading: 'Reading',
  writing: 'Writing',
  speaking: 'Speaking',
};

export default function ExamInterface() {
  const { examId } = useParams<{ examId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeSection, setActiveSection] = useState<SectionType | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: exam, isLoading: examLoading } = useQuery({
    queryKey: ['exam', examId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('exams')
        .select('*')
        .eq('id', examId)
        .single();

      if (error) throw error;
      return data;
    },
  });

  const { data: sections, isLoading: sectionsLoading } = useQuery({
    queryKey: ['exam-sections', examId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('exam_sections')
        .select(`
          *,
          question_groups (
            *,
            questions (*)
          )
        `)
        .eq('exam_id', examId)
        .order('order_index', { ascending: true });

      if (error) throw error;
      return data;
    },
    enabled: !!examId,
  });

  // Set default active section
  useEffect(() => {
    if (sections && sections.length > 0 && !activeSection) {
      setActiveSection(sections[0].section_type as SectionType);
    }
  }, [sections, activeSection]);

  const availableSections = sections?.filter(s => 
    s.question_groups && s.question_groups.length > 0
  ) || [];

  const currentSectionIndex = availableSections.findIndex(
    s => s.section_type === activeSection
  );

  const currentSection = availableSections[currentSectionIndex];

  const handlePrevSection = () => {
    if (currentSectionIndex > 0) {
      setActiveSection(availableSections[currentSectionIndex - 1].section_type as SectionType);
    }
  };

  const handleNextSection = () => {
    if (currentSectionIndex < availableSections.length - 1) {
      setActiveSection(availableSections[currentSectionIndex + 1].section_type as SectionType);
    }
  };

  const handleAnswerChange = (questionId: string, answer: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: answer }));
  };

  const handleSubmit = async () => {
    if (!user || !examId) return;

    setIsSubmitting(true);
    try {
      // Create submission
      const { data: submission, error: submissionError } = await supabase
        .from('exam_submissions')
        .insert({
          exam_id: examId,
          student_id: user.id,
          status: 'submitted',
          submitted_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (submissionError) throw submissionError;

      // Save answers
      const answerEntries = Object.entries(answers).map(([questionId, answerText]) => ({
        submission_id: submission.id,
        question_id: questionId,
        answer_text: answerText,
      }));

      if (answerEntries.length > 0) {
        const { error: answersError } = await supabase
          .from('answers')
          .insert(answerEntries);

        if (answersError) throw answersError;
      }

      toast({
        title: 'Nộp bài thành công',
        description: 'Bài thi của bạn đã được ghi nhận',
      });

      navigate('/my-courses');
    } catch (error: any) {
      toast({
        title: 'Lỗi',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (examLoading || sectionsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!exam || availableSections.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <h2 className="text-xl font-semibold mb-4">Không tìm thấy bài thi</h2>
        <Button asChild>
          <Link to="/">Quay về trang chủ</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur">
        <div className="flex h-14 items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" asChild>
              <Link to="/">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Thoát
              </Link>
            </Button>
            <div className="hidden md:block">
              <h1 className="font-semibold">{exam.title}</h1>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <ExamTimer duration={exam.duration_minutes || 60} />
            <Button 
              onClick={handleSubmit} 
              disabled={isSubmitting}
              className="bg-primary hover:bg-primary/90"
            >
              <Send className="mr-2 h-4 w-4" />
              {isSubmitting ? 'Đang nộp...' : 'Nộp bài'}
            </Button>
          </div>
        </div>

        {/* Section Tabs */}
        <div className="border-t">
          <div className="flex items-center gap-1 p-2 overflow-x-auto">
            {availableSections.map((section) => {
              const Icon = sectionIcons[section.section_type as SectionType];
              const isActive = activeSection === section.section_type;
              
              return (
                <Button
                  key={section.id}
                  variant={isActive ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setActiveSection(section.section_type as SectionType)}
                  className={`flex items-center gap-2 ${
                    isActive ? '' : 'text-muted-foreground'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {sectionLabels[section.section_type as SectionType]}
                </Button>
              );
            })}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden">
        {currentSection && activeSection === 'listening' && (
          <ListeningSection 
            section={currentSection} 
            answers={answers}
            onAnswerChange={handleAnswerChange}
          />
        )}
        {currentSection && activeSection === 'reading' && (
          <ReadingSection 
            section={currentSection}
            answers={answers}
            onAnswerChange={handleAnswerChange}
          />
        )}
        {currentSection && activeSection === 'writing' && (
          <WritingSection 
            section={currentSection}
            answers={answers}
            onAnswerChange={handleAnswerChange}
          />
        )}
        {currentSection && activeSection === 'speaking' && (
          <SpeakingSection 
            section={currentSection}
            answers={answers}
            onAnswerChange={handleAnswerChange}
          />
        )}
      </main>

      {/* Footer Navigation */}
      <footer className="border-t bg-background p-4">
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          <Button
            variant="outline"
            onClick={handlePrevSection}
            disabled={currentSectionIndex === 0}
          >
            <ChevronLeft className="mr-2 h-4 w-4" />
            Phần trước
          </Button>

          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              {currentSectionIndex + 1} / {availableSections.length}
            </span>
            <Progress 
              value={((currentSectionIndex + 1) / availableSections.length) * 100} 
              className="w-24 h-2"
            />
          </div>

          <Button
            variant="outline"
            onClick={handleNextSection}
            disabled={currentSectionIndex === availableSections.length - 1}
          >
            Phần sau
            <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </footer>
    </div>
  );
}
