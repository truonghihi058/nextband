import { useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, FileText, Clock, CheckCircle2, AlertCircle, Loader2, Trophy } from 'lucide-react';
import { AnswerResultCard } from '@/components/submission/AnswerResultCard';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline'; icon: React.ElementType }> = {
  in_progress: { label: 'Đang làm', variant: 'secondary', icon: Clock },
  submitted: { label: 'Đã nộp - Chờ chấm', variant: 'outline', icon: AlertCircle },
  graded: { label: 'Đã chấm điểm', variant: 'default', icon: CheckCircle2 },
};

export default function SubmissionDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const { data: submission, isLoading } = useQuery({
    queryKey: ['student-submission', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('exam_submissions')
        .select(`
          *,
          exams (id, title, exam_type, duration_minutes, courses (title))
        `)
        .eq('id', id!)
        .eq('student_id', user!.id)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!id && !!user,
  });

  const { data: sections } = useQuery({
    queryKey: ['student-submission-sections', submission?.exam_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('exam_sections')
        .select(`
          id, section_type, title, order_index,
          question_groups (
            id, title, instructions, order_index,
            questions (
              id, question_type, question_text, correct_answer, points, order_index
            )
          )
        `)
        .eq('exam_id', submission!.exam_id)
        .order('order_index');

      if (error) throw error;
      return data;
    },
    enabled: !!submission?.exam_id,
  });

  const { data: answers } = useQuery({
    queryKey: ['student-submission-answers', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('answers')
        .select('*')
        .eq('submission_id', id!);

      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const answerMap = useMemo(() => {
    const map: Record<string, NonNullable<typeof answers>[number]> = {};
    answers?.forEach((a) => {
      map[a.question_id] = a;
    });
    return map;
  }, [answers]);

  const allQuestions = useMemo(() => {
    if (!sections) return [];
    return sections.flatMap((sec) =>
      (sec.question_groups || [])
        .sort((a, b) => (a.order_index || 0) - (b.order_index || 0))
        .flatMap((g) =>
          (g.questions || []).sort((a, b) => (a.order_index || 0) - (b.order_index || 0))
        )
    );
  }, [sections]);

  const totalPoints = allQuestions.reduce((sum, q) => sum + (q.points || 1), 0);
  const isGraded = submission?.status === 'graded';
  const answeredCount = allQuestions.filter((q) => answerMap[q.id]?.answer_text || answerMap[q.id]?.audio_url).length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!submission) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Không tìm thấy bài làm này</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate('/my-submissions')}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Quay lại
        </Button>
      </div>
    );
  }

  const exam = submission.exams as any;
  const status = statusConfig[submission.status || 'in_progress'];
  const StatusIcon = status.icon;

  let questionCounter = 0;

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-fade-in">
      {/* Back */}
      <Button variant="ghost" size="sm" onClick={() => navigate('/my-submissions')}>
        <ArrowLeft className="h-4 w-4 mr-1" /> Bài đã làm
      </Button>

      {/* Header card */}
      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <h1 className="text-xl font-bold text-foreground">{exam?.title || 'Bài thi'}</h1>
              <div className="flex items-center gap-2 flex-wrap text-sm text-muted-foreground">
                <FileText className="h-4 w-4" />
                <span>{exam?.courses?.title || 'Không rõ khóa học'}</span>
                <Badge variant="secondary">{exam?.exam_type?.toUpperCase()}</Badge>
              </div>
            </div>
            <Badge variant={status.variant} className="gap-1.5 px-3 py-1.5 text-sm">
              <StatusIcon className="h-4 w-4" />
              {status.label}
            </Badge>
          </div>

          <Separator />

          {/* Stats row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-xs text-muted-foreground">Câu hỏi</p>
              <p className="text-lg font-semibold">{allQuestions.length}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-muted-foreground">Đã trả lời</p>
              <p className="text-lg font-semibold">{answeredCount}/{allQuestions.length}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-muted-foreground">Ngày làm</p>
              <p className="text-sm font-medium">
                {submission.started_at
                  ? format(new Date(submission.started_at), 'dd/MM/yyyy', { locale: vi })
                  : '—'}
              </p>
            </div>
            <div className="text-center">
              <p className="text-xs text-muted-foreground">Ngày nộp</p>
              <p className="text-sm font-medium">
                {submission.submitted_at
                  ? format(new Date(submission.submitted_at), 'dd/MM/yyyy HH:mm', { locale: vi })
                  : '—'}
              </p>
            </div>
          </div>

          {/* Score display - only for graded */}
          {isGraded && submission.total_score != null && (
            <>
              <Separator />
              <div className="flex flex-col items-center gap-3 py-2">
                <div className="flex items-center gap-2">
                  <Trophy className="h-6 w-6 text-primary" />
                  <span className="text-3xl font-bold text-primary">{submission.total_score}</span>
                  <span className="text-lg text-muted-foreground">/ {totalPoints}</span>
                </div>
                <Progress
                  value={totalPoints > 0 ? (submission.total_score / totalPoints) * 100 : 0}
                  className="w-full max-w-xs h-2"
                />
                <p className="text-sm text-muted-foreground">
                  Đạt {totalPoints > 0 ? Math.round((submission.total_score / totalPoints) * 100) : 0}%
                </p>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Questions by section */}
      {sections
        ?.sort((a, b) => (a.order_index || 0) - (b.order_index || 0))
        .map((section) => (
          <div key={section.id} className="space-y-4">
            <CardHeader className="px-0 pb-2">
              <CardTitle className="text-lg">
                {section.title}
                <span className="text-sm font-normal text-muted-foreground ml-2">
                  ({section.section_type})
                </span>
              </CardTitle>
            </CardHeader>

            {(section.question_groups || [])
              .sort((a, b) => (a.order_index || 0) - (b.order_index || 0))
              .map((group) => (
                <div key={group.id} className="space-y-3">
                  {group.title && (
                    <div className="pl-1">
                      <h3 className="font-medium text-sm">{group.title}</h3>
                      {group.instructions && (
                        <p className="text-xs text-muted-foreground mt-0.5">{group.instructions}</p>
                      )}
                    </div>
                  )}

                  {(group.questions || [])
                    .sort((a, b) => (a.order_index || 0) - (b.order_index || 0))
                    .map((question) => {
                      questionCounter++;
                      const answer = answerMap[question.id];

                      return (
                        <AnswerResultCard
                          key={question.id}
                          questionIndex={questionCounter}
                          questionText={question.question_text}
                          questionType={question.question_type}
                          correctAnswer={question.correct_answer}
                          points={question.points || 1}
                          answerText={answer?.answer_text || null}
                          audioUrl={answer?.audio_url || null}
                          score={answer?.score ?? null}
                          feedback={answer?.feedback ?? null}
                          isGraded={isGraded}
                        />
                      );
                    })}
                </div>
              ))}
          </div>
        ))}
    </div>
  );
}
