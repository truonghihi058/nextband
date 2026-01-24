import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Edit, ArrowUpDown } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

type SortField = 'title' | 'created_at' | 'level';
type SortOrder = 'asc' | 'desc';

export default function AdminCourses() {
  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState<SortField>('created_at');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const { data: courses, isLoading } = useQuery({
    queryKey: ['admin-courses', search, sortField, sortOrder],
    queryFn: async () => {
      let query = supabase
        .from('courses')
        .select('*')
        .order(sortField, { ascending: sortOrder === 'asc' });
      
      if (search) query = query.ilike('title', `%${search}%`);
      const { data } = await query;
      return data || [];
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from('courses')
        .update({ is_active } as any)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-courses'] });
      toast({ title: 'Đã cập nhật trạng thái' });
    },
  });

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Quản lý khóa học</h1>
        <Button asChild>
          <Link to="/admin/courses/create">
            <Plus className="mr-2 h-4 w-4" />
            Thêm khóa học
          </Link>
        </Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Tìm kiếm..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <SortHeader field="title">Tên khóa học</SortHeader>
              <SortHeader field="level">Cấp độ</SortHeader>
              <TableHead>Xuất bản</TableHead>
              <TableHead>Kích hoạt</TableHead>
              <TableHead className="w-[100px]">Hành động</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8">Đang tải...</TableCell>
              </TableRow>
            ) : courses?.map((course: any) => (
              <TableRow key={course.id}>
                <TableCell className="font-medium">{course.title}</TableCell>
                <TableCell>{course.level}</TableCell>
                <TableCell>
                  <Badge variant={course.is_published ? 'default' : 'secondary'}>
                    {course.is_published ? 'Đã xuất bản' : 'Nháp'}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Switch
                    checked={course.is_active ?? true}
                    onCheckedChange={(checked) => 
                      toggleMutation.mutate({ id: course.id, is_active: checked })
                    }
                  />
                </TableCell>
                <TableCell>
                  <Button variant="ghost" size="sm" asChild>
                    <Link to={`/admin/courses/${course.id}`}><Edit className="h-4 w-4" /></Link>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
