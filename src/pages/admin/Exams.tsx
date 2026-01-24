import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function AdminExams() {
  const { data: exams } = useQuery({
    queryKey: ['admin-exams'],
    queryFn: async () => {
      const { data } = await supabase.from('exams').select('*, courses(title)').order('created_at', { ascending: false });
      return data || [];
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Quản lý bài thi</h1>
        <Button><Plus className="mr-2 h-4 w-4" />Thêm bài thi</Button>
      </div>
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tên bài thi</TableHead>
              <TableHead>Khóa học</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead className="w-[100px]">Hành động</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {exams?.map((exam: any) => (
              <TableRow key={exam.id}>
                <TableCell className="font-medium">{exam.title}</TableCell>
                <TableCell>{exam.courses?.title || '-'}</TableCell>
                <TableCell><Badge variant={exam.is_published ? 'default' : 'secondary'}>{exam.is_published ? 'Đã xuất bản' : 'Nháp'}</Badge></TableCell>
                <TableCell><Button variant="ghost" size="sm" asChild><Link to={`/admin/exams/${exam.id}`}><Edit className="h-4 w-4" /></Link></Button></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
