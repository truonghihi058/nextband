import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { submissionsApi, examsApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowUpDown, Eye, User, Filter } from "lucide-react";

type SortField = "submittedAt" | "status";
type SortOrder = "asc" | "desc";
type StatusFilter = "all" | "in_progress" | "submitted" | "graded";

export default function AdminCheckAttempt() {
  const [sortField, setSortField] = useState<SortField>("submittedAt");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [examFilter, setExamFilter] = useState<string>("all");

  const { data: examsData } = useQuery({
    queryKey: ["admin-exams-filter"],
    queryFn: () => examsApi.list({ limit: 100 }),
  });

  const exams = examsData?.data || [];

  const { data: submissionsData, isLoading } = useQuery({
    queryKey: [
      "admin-submissions",
      sortField,
      sortOrder,
      statusFilter,
      examFilter,
    ],
    queryFn: () =>
      submissionsApi.list({
        status: statusFilter !== "all" ? statusFilter : undefined,
        examId: examFilter !== "all" ? examFilter : undefined,
      }),
  });

  const submissions = submissionsData?.data || [];

  // Client-side sorting
  const sortedSubmissions = [...submissions].sort((a: any, b: any) => {
    let comparison = 0;
    if (sortField === "submittedAt") {
      comparison =
        new Date(a.submittedAt || 0).getTime() -
        new Date(b.submittedAt || 0).getTime();
    } else if (sortField === "status") {
      comparison = (a.status || "").localeCompare(b.status || "");
    }
    return sortOrder === "asc" ? comparison : -comparison;
  });

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("desc");
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

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case "graded":
        return <Badge className="bg-green-500">Đã chấm</Badge>;
      case "in_progress":
        return <Badge variant="secondary">Đang làm</Badge>;
      case "submitted":
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
            <Select
              value={statusFilter}
              onValueChange={(v) => setStatusFilter(v as StatusFilter)}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả trạng thái</SelectItem>
                <SelectItem value="in_progress">Đang làm</SelectItem>
                <SelectItem value="submitted">Đã nộp</SelectItem>
                <SelectItem value="graded">Đã chấm</SelectItem>
              </SelectContent>
            </Select>

            <Select value={examFilter} onValueChange={setExamFilter}>
              <SelectTrigger className="w-[220px]">
                <SelectValue placeholder="Bài thi" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả bài thi</SelectItem>
                {exams?.map((exam: any) => (
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
              <SortHeader field="submittedAt">Ngày nộp</SortHeader>
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
            ) : sortedSubmissions && sortedSubmissions.length > 0 ? (
              sortedSubmissions.map((submission: any) => (
                <TableRow key={submission.id} className="hover:bg-muted/50">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage
                          src={submission.student?.avatarUrl || undefined}
                        />
                        <AvatarFallback>
                          <User className="h-4 w-4" />
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">
                          {submission.student?.fullName || "Chưa đặt tên"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {submission.student?.email}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{submission.exam?.title || "-"}</TableCell>
                  <TableCell>
                    {submission.submittedAt
                      ? new Date(submission.submittedAt).toLocaleString("vi-VN")
                      : "-"}
                  </TableCell>
                  <TableCell>{getStatusBadge(submission.status)}</TableCell>
                  <TableCell>
                    {submission.totalScore != null
                      ? submission.totalScore
                      : "-"}
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
                <TableCell
                  colSpan={6}
                  className="text-center py-8 text-muted-foreground"
                >
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
