import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { ClipboardList, Clock, CheckCircle2, AlertCircle, Eye } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: React.ElementType }> = {
  in_progress: { label: 'Đang làm', variant: 'secondary', icon: Clock },
  submitted: { label: 'Đã nộp', variant: 'outline', icon: AlertCircle },
  graded: { label: 'Đã chấm', variant: 'default', icon: CheckCircle2 },
};

export default function MySubmissions() {
  const { user } = useAuth();

  const { data: submissions, isLoading } = useQuery({
    queryKey: ['my-submissions', user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('exam_submissions')
        .select(`
          *,
          exams (
            id,
            title,
            exam_type,
            duration_minutes,
            courses (title)
          )
        `)
        .eq('student_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground mb-2">
          Bài Đã Làm
        </h1>
        <p className="text-muted-foreground">
          Xem lại lịch sử và kết quả các bài thi bạn đã thực hiện
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-lg" />
          ))}
        </div>
      ) : submissions && submissions.length > 0 ? (
        <div className="border rounded-xl overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Bài thi</TableHead>
                <TableHead>Khóa học</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead className="text-center">Điểm</TableHead>
                <TableHead>Ngày làm</TableHead>
                <TableHead className="text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {submissions.map((submission) => {
                const status = statusConfig[submission.status || 'in_progress'];
                const StatusIcon = status.icon;
                const exam = submission.exams as any;

                return (
                  <TableRow key={submission.id}>
                    <TableCell className="font-medium">
                      {exam?.title || 'Không rõ'}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {exam?.courses?.title || '—'}
                    </TableCell>
                    <TableCell>
                      <Badge variant={status.variant} className="gap-1">
                        <StatusIcon className="h-3 w-3" />
                        {status.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      {submission.status === 'graded' && submission.total_score != null
                        ? <span className="font-semibold text-primary">{submission.total_score}</span>
                        : <span className="text-muted-foreground">—</span>
                      }
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {submission.started_at
                        ? format(new Date(submission.started_at), 'dd/MM/yyyy HH:mm', { locale: vi })
                        : '—'}
                    </TableCell>
                    <TableCell className="text-right">
                      {submission.status === 'in_progress' ? (
                        <Button size="sm" asChild>
                          <Link to={`/exam/${submission.exam_id}`}>
                            Tiếp tục
                          </Link>
                        </Button>
                      ) : submission.status === 'graded' ? (
                        <Button size="sm" variant="outline" asChild>
                          <Link to={`/submissions/${submission.id}`}>
                            <Eye className="mr-1 h-3.5 w-3.5" />
                            Xem kết quả
                          </Link>
                        </Button>
                      ) : (
                        <span className="text-xs text-muted-foreground">Chờ chấm</span>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="text-center py-16 border rounded-2xl bg-muted/30">
          <ClipboardList className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">
            Bạn chưa làm bài thi nào
          </h3>
          <p className="text-muted-foreground mb-6">
            Hãy vào khóa học và bắt đầu làm bài thi đầu tiên của bạn
          </p>
          <Button asChild>
            <Link to="/">Khám phá khóa học</Link>
          </Button>
        </div>
      )}
    </div>
  );
}
