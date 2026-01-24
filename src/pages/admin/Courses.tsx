import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Edit } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useState } from 'react';

export default function AdminCourses() {
  const [search, setSearch] = useState('');
  
  const { data: courses, isLoading } = useQuery({
    queryKey: ['admin-courses', search],
    queryFn: async () => {
      let query = supabase.from('courses').select('*').order('created_at', { ascending: false });
      if (search) query = query.ilike('title', `%${search}%`);
      const { data } = await query;
      return data || [];
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Quản lý khóa học</h1>
        <Button><Plus className="mr-2 h-4 w-4" />Thêm khóa học</Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Tìm kiếm..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tên khóa học</TableHead>
              <TableHead>Cấp độ</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead className="w-[100px]">Hành động</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {courses?.map((course) => (
              <TableRow key={course.id}>
                <TableCell className="font-medium">{course.title}</TableCell>
                <TableCell>{course.level}</TableCell>
                <TableCell>
                  <Badge variant={course.is_published ? 'default' : 'secondary'}>
                    {course.is_published ? 'Đã xuất bản' : 'Nháp'}
                  </Badge>
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
