import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, ArrowUpDown, Search } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { useServerPagination } from '@/hooks/useServerPagination';
import { DataTablePagination } from '@/components/admin/DataTablePagination';

type SortField = 'title' | 'created_at' | 'week';

export default function AdminExams() {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const {
    page,
    pageSize,
    sortField,
    sortOrder,
    setPage,
    setPageSize,
    toggleSort,
    resetPage,
    getRange,
  } = useServerPagination<SortField>('created_at', 10);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      resetPage();
    }, 300);
    return () => clearTimeout(timer);
  }, [search, resetPage]);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-exams', debouncedSearch, sortField, sortOrder, page, pageSize],
    queryFn: async () => {
      const { from, to } = getRange();
      
      let query = supabase
        .from('exams')
        .select('*, courses(title)', { count: 'exact' })
        .order(sortField, { ascending: sortOrder === 'asc' })
        .range(from, to);

      if (debouncedSearch) {
        query = query.ilike('title', `%${debouncedSearch}%`);
      }

      const { data, count, error } = await query;
      if (error) throw error;
      
      return {
        data: data || [],
        total: count || 0,
        currentPage: page,
        perPage: pageSize,
        lastPage: Math.ceil((count || 0) / pageSize),
      };
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from('exams')
        .update({ is_active } as any)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-exams'] });
      toast({ title: 'Đã cập nhật trạng thái' });
    },
  });

  const SortHeader = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
    <TableHead 
      className="cursor-pointer hover:bg-muted/50 transition-colors" 
      onClick={() => toggleSort(field)}
    >
      <div className="flex items-center gap-1">
        {children}
        <ArrowUpDown className={`h-3 w-3 ${sortField === field ? 'text-primary' : 'text-muted-foreground'}`} />
      </div>
    </TableHead>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Quản lý bài thi</h1>
        <Button asChild>
          <Link to="/admin/exams/create">
            <Plus className="mr-2 h-4 w-4" />
            Thêm bài thi
          </Link>
        </Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input 
          placeholder="Tìm kiếm..." 
          value={search} 
          onChange={(e) => setSearch(e.target.value)} 
          className="pl-10" 
        />
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <SortHeader field="title">Tên bài thi</SortHeader>
              <TableHead>Khóa học</TableHead>
              <SortHeader field="week">Tuần</SortHeader>
              <TableHead>Xuất bản</TableHead>
              <TableHead>Kích hoạt</TableHead>
              <TableHead className="w-[100px]">Hành động</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">Đang tải...</TableCell>
              </TableRow>
            ) : data?.data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  Không tìm thấy bài thi nào
                </TableCell>
              </TableRow>
            ) : data?.data.map((exam: any) => (
              <TableRow key={exam.id}>
                <TableCell className="font-medium">{exam.title}</TableCell>
                <TableCell>{exam.courses?.title || '-'}</TableCell>
                <TableCell>Tuần {exam.week || 1}</TableCell>
                <TableCell>
                  <Badge variant={exam.is_published ? 'default' : 'secondary'}>
                    {exam.is_published ? 'Đã xuất bản' : 'Nháp'}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Switch
                    checked={exam.is_active ?? true}
                    onCheckedChange={(checked) => 
                      toggleMutation.mutate({ id: exam.id, is_active: checked })
                    }
                  />
                </TableCell>
                <TableCell>
                  <Button variant="ghost" size="sm" asChild>
                    <Link to={`/admin/exams/${exam.id}`}><Edit className="h-4 w-4" /></Link>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        
        {data && (
          <DataTablePagination
            currentPage={data.currentPage}
            totalPages={data.lastPage}
            pageSize={pageSize}
            totalItems={data.total}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
          />
        )}
      </div>
    </div>
  );
}
