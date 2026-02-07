import { useState, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { ArrowLeft, Save, CheckCheck, Loader2 } from 'lucide-react';
import { SubmissionHeader } from '@/components/grading/SubmissionHeader';
import { AnswerGradingCard } from '@/components/grading/AnswerGradingCard';
import { useAuth } from '@/hooks/useAuth';

interface GradeUpdate {
  answerId: string;
  score: number | null;
  feedback: string;
}

export default function SubmissionGrade() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [grades, setGrades] = useState<Record<string, GradeUpdate>>({});

  // Fetch submission with related data
  const { data: submission, isLoading } = useQuery({
    queryKey: ['submission-grade', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('exam_submissions')
        .select(`
          *,
          exams (id, title, exam_type),
          profiles!exam_submissions_student_id_profiles_fkey (id, user_id, email, full_name, avatar_url)
        `)
        .eq('id', id!)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  // Fetch sections, groups, questions, and answers
  const { data: sections } = useQuery({
    queryKey: ['submission-sections', submission?.exam_id],
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
    queryKey: ['submission-answers', id],
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

  // Build answer map for quick lookup
  const answerMap = useMemo(() => {
    const map: Record<string, typeof answers extends (infer T)[] | null ? T : never> = {};
    answers?.forEach((a) => {
      map[a.question_id] = a;
    });
    return map;
  }, [answers]);

  // All questions flat list for counting
  const allQuestions = useMemo(() => {
    if (!sections) return [];
    return sections.flatMap((sec) =>
      (sec.question_groups || [])
        .sort((a, b) => (a.order_index || 0) - (b.order_index || 0))
        .flatMap((g) =>
          (g.questions || [])
            .sort((a, b) => (a.order_index || 0) - (b.order_index || 0))
        )
    );
  }, [sections]);

  const handleScoreChange = useCallback((answerId: string, questionId: string, score: number | null) => {
    setGrades((prev) => ({
      ...prev,
      [questionId]: {
        ...prev[questionId],
        answerId,
        score,
        feedback: prev[questionId]?.feedback || '',
      },
    }));
  }, []);

  const handleFeedbackChange = useCallback((answerId: string, questionId: string, feedback: string) => {
    setGrades((prev) => ({
      ...prev,
      [questionId]: {
        ...prev[questionId],
        answerId,
        score: prev[questionId]?.score ?? null,
        feedback,
      },
    }));
  }, []);

  // Save grades mutation
  const saveMutation = useMutation({
    mutationFn: async ({ finalize }: { finalize: boolean }) => {
      const updates = Object.values(grades).filter((g) => g.answerId);

      // Update each answer's score and feedback
      for (const update of updates) {
        const { error } = await supabase
          .from('answers')
          .update({
            score: update.score,
            feedback: update.feedback || null,
          })
          .eq('id', update.answerId);

        if (error) throw error;
      }

      if (finalize) {
        // Calculate total score
        const updatedAnswers = await supabase
          .from('answers')
          .select('score')
          .eq('submission_id', id!);

        const totalScore = (updatedAnswers.data || []).reduce(
          (sum, a) => sum + (a.score || 0),
          0
        );

        const { error } = await supabase
          .from('exam_submissions')
          .update({
            status: 'graded',
            total_score: totalScore,
            graded_by: user?.id || null,
            graded_at: new Date().toISOString(),
          })
          .eq('id', id!);

        if (error) throw error;
      }
    },
    onSuccess: (_, { finalize }) => {
      queryClient.invalidateQueries({ queryKey: ['submission-grade', id] });
      queryClient.invalidateQueries({ queryKey: ['submission-answers', id] });
      queryClient.invalidateQueries({ queryKey: ['admin-submissions'] });

      if (finalize) {
        toast.success('Đã chấm xong bài thi!');
        navigate('/admin/check-attempt');
      } else {
        toast.success('Đã lưu điểm!');
      }
    },
    onError: (err: Error) => {
      toast.error('Lỗi khi lưu: ' + err.message);
    },
  });

  // Stats
  const gradedCount = allQuestions.filter((q) => {
    const grade = grades[q.id];
    const answer = answerMap[q.id];
    return (grade?.score != null) || (answer?.score != null);
  }).length;

  const totalPoints = allQuestions.reduce((sum, q) => sum + (q.points || 1), 0);

  const currentTotal = allQuestions.reduce((sum, q) => {
    const grade = grades[q.id];
    const answer = answerMap[q.id];
    const score = grade?.score ?? answer?.score ?? 0;
    return sum + score;
  }, 0);

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
        <p className="text-muted-foreground">Không tìm thấy bài nộp</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate('/admin/check-attempt')}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Quay lại
        </Button>
      </div>
    );
  }

  let questionCounter = 0;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Back button */}
      <Button variant="ghost" size="sm" onClick={() => navigate('/admin/check-attempt')}>
        <ArrowLeft className="h-4 w-4 mr-1" /> Danh sách bài nộp
      </Button>

      {/* Header */}
      <SubmissionHeader
        student={submission.profiles as any}
        exam={submission.exams as any}
        status={submission.status}
        submittedAt={submission.submitted_at}
      />

      <Separator />

      {/* Score summary bar */}
      <Card>
        <CardContent className="py-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-6 text-sm">
              <div>
                <span className="text-muted-foreground">Đã chấm:</span>{' '}
                <span className="font-semibold">{gradedCount}/{allQuestions.length}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Tổng điểm hiện tại:</span>{' '}
                <span className="font-semibold">{currentTotal}/{totalPoints}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => saveMutation.mutate({ finalize: false })}
                disabled={saveMutation.isPending}
              >
                {saveMutation.isPending ? (
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-1" />
                )}
                Lưu nháp
              </Button>
              <Button
                size="sm"
                onClick={() => saveMutation.mutate({ finalize: true })}
                disabled={saveMutation.isPending}
              >
                {saveMutation.isPending ? (
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                ) : (
                  <CheckCheck className="h-4 w-4 mr-1" />
                )}
                Hoàn tất chấm
              </Button>
            </div>
          </div>
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
                      const grade = grades[question.id];

                      return (
                        <AnswerGradingCard
                          key={question.id}
                          questionIndex={questionCounter}
                          questionText={question.question_text}
                          questionType={question.question_type}
                          correctAnswer={question.correct_answer}
                          points={question.points || 1}
                          answerText={answer?.answer_text || null}
                          audioUrl={answer?.audio_url || null}
                          currentScore={grade?.score ?? answer?.score ?? null}
                          currentFeedback={grade?.feedback ?? answer?.feedback ?? null}
                          onScoreChange={(score) =>
                            handleScoreChange(answer?.id || '', question.id, score)
                          }
                          onFeedbackChange={(fb) =>
                            handleFeedbackChange(answer?.id || '', question.id, fb)
                          }
                        />
                      );
                    })}
                </div>
              ))}
          </div>
        ))}

      {/* Bottom action bar */}
      <div className="sticky bottom-0 bg-background border-t py-3 flex items-center justify-end gap-2 -mx-6 px-6">
        <Button
          variant="outline"
          onClick={() => saveMutation.mutate({ finalize: false })}
          disabled={saveMutation.isPending}
        >
          <Save className="h-4 w-4 mr-1" /> Lưu nháp
        </Button>
        <Button
          onClick={() => saveMutation.mutate({ finalize: true })}
          disabled={saveMutation.isPending}
        >
          <CheckCheck className="h-4 w-4 mr-1" /> Hoàn tất chấm
        </Button>
      </div>
    </div>
  );
}
