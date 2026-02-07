import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User, Clock, FileText } from 'lucide-react';

interface SubmissionHeaderProps {
  student: {
    full_name: string | null;
    email: string | null;
    avatar_url: string | null;
  } | null;
  exam: {
    title: string;
    exam_type: string;
  } | null;
  status: string | null;
  submittedAt: string | null;
}

export function SubmissionHeader({ student, exam, status, submittedAt }: SubmissionHeaderProps) {
  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case 'graded':
        return <Badge className="bg-green-600 text-white">Đã chấm</Badge>;
      case 'submitted':
        return <Badge variant="outline">Đã nộp</Badge>;
      case 'in_progress':
        return <Badge variant="secondary">Đang làm</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <div className="flex items-center gap-4">
        <Avatar className="h-12 w-12">
          <AvatarImage src={student?.avatar_url || undefined} />
          <AvatarFallback><User className="h-6 w-6" /></AvatarFallback>
        </Avatar>
        <div>
          <h1 className="text-xl font-bold">{student?.full_name || 'Chưa đặt tên'}</h1>
          <p className="text-sm text-muted-foreground">{student?.email}</p>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-3 text-sm">
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <FileText className="h-4 w-4" />
          <span>{exam?.title}</span>
          <Badge variant="secondary" className="ml-1">{exam?.exam_type?.toUpperCase()}</Badge>
        </div>
        {submittedAt && (
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>{new Date(submittedAt).toLocaleString('vi-VN')}</span>
          </div>
        )}
        {getStatusBadge(status)}
      </div>
    </div>
  );
}
