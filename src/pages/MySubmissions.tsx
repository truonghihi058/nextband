import { useState, useCallback, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Link } from 'react-router-dom';
import { ClipboardList, Clock, CheckCircle2, AlertCircle, Eye, Search, X } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { DataTablePagination } from '@/components/admin/DataTablePagination';
import { useServerPagination } from '@/hooks/useServerPagination';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: React.ElementType }> = {
  in_progress: { label: 'Đang làm', variant: 'secondary', icon: Clock },
  submitted: { label: 'Đã nộp', variant: 'outline', icon: AlertCircle },
  graded: { label: 'Đã chấm', variant: 'default', icon: CheckCircle2 },
};

const STATUS_OPTIONS = [
  { value: 'all', label: 'Tất cả trạng thái' },
  { value: 'in_progress', label: 'Đang làm' },
  { value: 'submitted', label: 'Đã nộp' },
  { value: 'graded', label: 'Đã chấm' },
];

export default function MySubmissions() {
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const { page, pageSize, sortField, sortOrder, setPage, setPageSize, toggleSort, resetPage, getRange } =
    useServerPagination<'created_at'>('created_at', 10);

  // Debounce search
  const debounceTimer = useMemo(() => ({ id: null as ReturnType<typeof setTimeout> | null }), []);
  const handleSearch = useCallback((value: string) => {
    setSearch(value);
    if (debounceTimer.id) clearTimeout(debounceTimer.id);
    debounceTimer.id = setTimeout(() => {
      setDebouncedSearch(value);
      resetPage();
    }, 400);
  }, [debounceTimer, resetPage]);

  const handleStatusChange = useCallback((value: string) => {
    setStatusFilter(value);
    resetPage();
  }, [resetPage]);

  // Fetch with server-side pagination
  const { data, isLoading } = useQuery({
    queryKey: ['my-submissions', user?.id, page, pageSize, sortField, sortOrder, debouncedSearch, statusFilter],
    queryFn: async () => {
      if (!user) return { items: [], count: 0 };

      const { from, to } = getRange();

      let query = supabase
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
        `, { count: 'exact' })
        .eq('student_id', user.id);

      // Status filter
      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter as 'in_progress' | 'submitted' | 'graded');
      }

      // Sort & paginate
      query = query
        .order(sortField, { ascending: sortOrder === 'asc' })
        .range(from, to);

      const { data: items, error, count } = await query;
      if (error) throw error;

      // Client-side search filter on exam title (since it's a joined field)
      let filtered = items || [];
      if (debouncedSearch.trim()) {
        const term = debouncedSearch.toLowerCase();
        filtered = filtered.filter((s) => {
          const exam = s.exams as any;
          return (
            exam?.title?.toLowerCase().includes(term) ||
            exam?.courses?.title?.toLowerCase().includes(term)
          );
        });
      }

      return { items: filtered, count: count || 0 };
    },
    enabled: !!user,
  });

  const submissions = data?.items || [];
  const totalItems = data?.count || 0;
  const totalPages = Math.ceil(totalItems / pageSize);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground mb-2">
          Bài Đã Làm
        </h1>
        <p className="text-muted-foreground">
          Xem lại lịch sử và kết quả các bài thi bạn đã thực hiện
        </p>
      </div>

      {/* Search & Filter bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Tìm theo tên bài thi hoặc khóa học..."
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-9 pr-9"
          />
          {search && (
            <button
              onClick={() => handleSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <Select value={statusFilter} onValueChange={handleStatusChange}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-lg" />
          ))}
        </div>
      ) : submissions.length > 0 ? (
        <div className="space-y-2">
          <div className="border rounded-xl overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Bài thi</TableHead>
                  <TableHead>Khóa học</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead className="text-center">Điểm</TableHead>
                  <TableHead
                    className="cursor-pointer select-none hover:text-foreground"
                    onClick={() => toggleSort('created_at')}
                  >
                    Ngày làm {sortField === 'created_at' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </TableHead>
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

          <DataTablePagination
            currentPage={page}
            totalPages={totalPages}
            pageSize={pageSize}
            totalItems={totalItems}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
          />
        </div>
      ) : (
        <div className="text-center py-16 border rounded-2xl bg-muted/30">
          <ClipboardList className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">
            {debouncedSearch || statusFilter !== 'all'
              ? 'Không tìm thấy bài thi nào phù hợp'
              : 'Bạn chưa làm bài thi nào'}
          </h3>
          <p className="text-muted-foreground mb-6">
            {debouncedSearch || statusFilter !== 'all'
              ? 'Hãy thử thay đổi bộ lọc hoặc từ khóa tìm kiếm'
              : 'Hãy vào khóa học và bắt đầu làm bài thi đầu tiên của bạn'}
          </p>
          {!debouncedSearch && statusFilter === 'all' && (
            <Button asChild>
              <Link to="/">Khám phá khóa học</Link>
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
