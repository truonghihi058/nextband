import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ArrowUpDown, Eye, User, Filter } from 'lucide-react';
import { Constants } from '@/integrations/supabase/types';

type SortField = 'submitted_at' | 'status';
type SortOrder = 'asc' | 'desc';
type StatusFilter = 'all' | 'pending_grading' | 'graded' | 'submitted';

export default function AdminCheckAttempt() {
  const [sortField, setSortField] = useState<SortField>('submitted_at');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [examFilter, setExamFilter] = useState<string>('all');

  const { data: exams } = useQuery({
    queryKey: ['admin-exams-filter'],
    queryFn: async () => {
      const { data } = await supabase.from('exams').select('id, title').order('title');
      return data || [];
    },
  });

  const { data: submissions, isLoading } = useQuery({
    queryKey: ['admin-submissions', sortField, sortOrder, statusFilter, examFilter],
    queryFn: async () => {
      let query = supabase
        .from('exam_submissions')
        .select(`
          *,
          exams (id, title),
          profiles:student_id (id, email, full_name, avatar_url)
        `)
        .not('submitted_at', 'is', null)
        .order(sortField, { ascending: sortOrder === 'asc' });

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      if (examFilter !== 'all') {
        query = query.eq('exam_id', examFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
  });

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const SortHeader = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
    <TableHead 
      className="cursor-pointer hover:bg-muted/50" 
      onClick={() => toggleSort(field)}
    >
      <div className="flex items-center gap-1">
        {children}
        <ArrowUpDown className="h-3 w-3" />
      </div>
    </TableHead>
  );

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case 'graded':
        return <Badge className="bg-green-500">Đã chấm</Badge>;
      case 'pending_grading':
        return <Badge variant="secondary">Chờ chấm</Badge>;
      case 'submitted':
        return <Badge variant="outline">Đã nộp</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Chấm bài thi</h1>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Lọc:</span>
            </div>
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả trạng thái</SelectItem>
                <SelectItem value="pending_grading">Chờ chấm</SelectItem>
                <SelectItem value="graded">Đã chấm</SelectItem>
                <SelectItem value="submitted">Đã nộp</SelectItem>
              </SelectContent>
            </Select>

            <Select value={examFilter} onValueChange={setExamFilter}>
              <SelectTrigger className="w-[220px]">
                <SelectValue placeholder="Bài thi" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả bài thi</SelectItem>
                {exams?.map((exam) => (
                  <SelectItem key={exam.id} value={exam.id}>
                    {exam.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Học viên</TableHead>
              <TableHead>Bài thi</TableHead>
              <SortHeader field="submitted_at">Ngày nộp</SortHeader>
              <SortHeader field="status">Trạng thái</SortHeader>
              <TableHead>Điểm</TableHead>
              <TableHead className="w-[100px]">Hành động</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  Đang tải...
                </TableCell>
              </TableRow>
            ) : submissions && submissions.length > 0 ? (
              submissions.map((submission: any) => (
                <TableRow key={submission.id} className="hover:bg-muted/50">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={submission.profiles?.avatar_url || undefined} />
                        <AvatarFallback><User className="h-4 w-4" /></AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{submission.profiles?.full_name || 'Chưa đặt tên'}</p>
                        <p className="text-xs text-muted-foreground">{submission.profiles?.email}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{submission.exams?.title || '-'}</TableCell>
                  <TableCell>
                    {submission.submitted_at 
                      ? new Date(submission.submitted_at).toLocaleString('vi-VN')
                      : '-'}
                  </TableCell>
                  <TableCell>{getStatusBadge(submission.status)}</TableCell>
                  <TableCell>
                    {submission.overall_score != null 
                      ? `${submission.overall_score}/9.0`
                      : '-'}
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" asChild>
                      <Link to={`/admin/submissions/${submission.id}`}>
                        <Eye className="h-4 w-4 mr-1" />
                        Xem
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  Không có bài nộp nào
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
