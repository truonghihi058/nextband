import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { examsApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Edit, ArrowUpDown } from "lucide-react";
import { useState } from "react";

interface CourseExamsListProps {
  courseId: string;
}

interface Exam {
  id: string;
  courseId: string;
  title: string;
  description: string | null;
  week: number;
  durationMinutes: number;
  isPublished: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

type SortField = "week" | "title" | "createdAt";
type SortOrder = "asc" | "desc";

export default function CourseExamsList({ courseId }: CourseExamsListProps) {
  const [sortField, setSortField] = useState<SortField>("week");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");

  const { data, isLoading } = useQuery({
    queryKey: ["course-exams-admin", courseId, sortField, sortOrder],
    queryFn: () => examsApi.list({ courseId }),
    enabled: !!courseId,
  });

  const exams = (data?.data || []) as Exam[];

  // Client-side sorting
  const sortedExams = [...exams].sort((a, b) => {
    let comparison = 0;
    if (sortField === "week") {
      comparison = (a.week || 0) - (b.week || 0);
    } else if (sortField === "title") {
      comparison = a.title.localeCompare(b.title);
    } else if (sortField === "createdAt") {
      comparison =
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    }
    return sortOrder === "asc" ? comparison : -comparison;
  });

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  const SortHeader = ({
    field,
    children,
  }: {
    field: SortField;
    children: React.ReactNode;
  }) => (
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
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Bài thi trong khóa học</CardTitle>
        <Button size="sm" asChild>
          <Link to={`/admin/exams/create?course_id=${courseId}`}>
            <Plus className="mr-2 h-4 w-4" />
            Thêm bài thi
          </Link>
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-muted-foreground">Đang tải...</p>
        ) : sortedExams && sortedExams.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <SortHeader field="week">Tuần</SortHeader>
                <SortHeader field="title">Tên bài thi</SortHeader>
                <TableHead>Trạng thái</TableHead>
                <TableHead>Kích hoạt</TableHead>
                <TableHead className="w-[80px]">Hành động</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedExams.map((exam) => (
                <TableRow key={exam.id}>
                  <TableCell className="font-medium">
                    Tuần {exam.week || 1}
                  </TableCell>
                  <TableCell>{exam.title}</TableCell>
                  <TableCell>
                    <Badge variant={exam.isPublished ? "default" : "secondary"}>
                      {exam.isPublished ? "Đã xuất bản" : "Nháp"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={exam.isActive ? "default" : "outline"}>
                      {exam.isActive ? "Hoạt động" : "Tắt"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" asChild>
                      <Link to={`/admin/exams/${exam.id}`}>
                        <Edit className="h-4 w-4" />
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <p className="text-center py-8 text-muted-foreground">
            Chưa có bài thi nào
          </p>
        )}
      </CardContent>
    </Card>
  );
}
