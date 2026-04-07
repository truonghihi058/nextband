import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { statsApi, usersApi } from "@/lib/api";
import {
  BookOpen,
  Users,
  FileText,
  GraduationCap,
  Mail,
  Phone,
  ChevronRight,
  CalendarRange,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";

export default function AdminDashboard() {
  const { data: stats } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: () => statsApi.getAdminStats(),
  });

  const currentYear = new Date().getFullYear();
  const [period, setPeriod] = useState<string>(() =>
    String(new Date().getMonth() + 1).padStart(2, "0"),
  );

  const { data: attendanceSummary } = useQuery({
    queryKey: ["admin-attendance-monthly", currentYear, period],
    queryFn: async () => {
      if (period === "year") {
        const monthly = await Promise.all(
          Array.from({ length: 12 }, async (_, i) => {
            const month = `${currentYear}-${String(i + 1).padStart(2, "0")}`;
            try {
              return await statsApi.getMonthlyAttendance({ month });
            } catch {
              return { totalPresent: 0, totalAbsent: 0, attendanceRate: 0 };
            }
          }),
        );

        const totalPresent = monthly.reduce(
          (sum, item) => sum + (item?.totalPresent ?? 0),
          0,
        );
        const totalAbsent = monthly.reduce(
          (sum, item) => sum + (item?.totalAbsent ?? 0),
          0,
        );
        const attendanceRate =
          totalPresent + totalAbsent > 0
            ? totalPresent / (totalPresent + totalAbsent)
            : 0;

        return { totalPresent, totalAbsent, attendanceRate };
      }

      const month = `${currentYear}-${period}`;
      return statsApi.getMonthlyAttendance({ month });
    },
  });

  const monthLabel = useMemo(() => {
    if (period === "year") return `Cả năm ${currentYear}`;
    return `Tháng ${Number(period)}/${currentYear}`;
  }, [currentYear, period]);

  const periods = useMemo(
    () => [
      ...Array.from({ length: 12 }, (_, i) => ({
        key: String(i + 1).padStart(2, "0"),
        label: `Tháng ${i + 1}`,
      })),
      { key: "year", label: "Cả năm" },
    ],
    [],
  );

  // Fetch recent teachers for the teacher list widget
  const { data: teachersData } = useQuery({
    queryKey: ["dashboard-teachers"],
    queryFn: () => usersApi.list({ role: "teacher", limit: 5 }),
  });

  const teachers = teachersData?.data || [];
  const totalTeachers = teachersData?.meta?.total || 0;

  const statCards = [
    {
      title: "Tổng khóa học",
      value: stats?.courses || 0,
      icon: BookOpen,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      title: "Tổng người dùng",
      value: stats?.users || 0,
      icon: Users,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
    },
    {
      title: "Tổng bài thi",
      value: stats?.exams || 0,
      icon: FileText,
      color: "text-emerald-500",
      bgColor: "bg-emerald-500/10",
    },
    {
      title: "Tổng giáo viên",
      value: totalTeachers,
      icon: GraduationCap,
      color: "text-amber-500",
      bgColor: "bg-amber-500/10",
    },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <Card key={stat.title} className="relative overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <div
                className={`flex h-9 w-9 items-center justify-center rounded-lg ${stat.bgColor}`}
              >
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Attendance Monthly Card */}
      <Card className="overflow-hidden">
        <CardHeader className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/10">
              <CalendarRange className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <CardTitle className="text-lg">Điểm danh theo tháng</CardTitle>
              <CardDescription>Tổng lượt có mặt (mọi lớp)</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <div className="overflow-x-auto pb-1">
            <div className="flex items-center gap-2 min-w-max">
              {periods.map((item) => (
                <Button
                  key={item.key}
                  type="button"
                  size="sm"
                  variant={period === item.key ? "default" : "outline"}
                  className={cn(
                    "h-8 rounded-full px-3 text-xs",
                    period === item.key && "bg-emerald-600 hover:bg-emerald-600/90",
                  )}
                  onClick={() => setPeriod(item.key)}
                >
                  {item.label}
                </Button>
              ))}
            </div>
          </div>
          <div className="text-sm text-muted-foreground">{monthLabel}</div>
          <div className="text-3xl font-bold">
            {attendanceSummary?.totalPresent ?? 0} lượt
          </div>
          <div className="text-sm text-muted-foreground">
            Vắng: {attendanceSummary?.totalAbsent ?? 0} ·
            Tỷ lệ chuyên cần:{" "}
            {attendanceSummary?.attendanceRate != null
              ? Math.round(attendanceSummary.attendanceRate * 100)
              : 0}
            %
          </div>
        </CardContent>
      </Card>

      {/* Teachers List Widget */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500/10">
                <GraduationCap className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <CardTitle className="text-lg">Danh sách giáo viên</CardTitle>
                <CardDescription>
                  {totalTeachers} giáo viên trong hệ thống
                </CardDescription>
              </div>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link to="/admin/teachers">
                Xem tất cả
                <ChevronRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {teachers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <GraduationCap className="h-10 w-10 mb-2 text-muted-foreground/50" />
              <p className="text-sm">Chưa có giáo viên nào</p>
              <Button variant="outline" size="sm" className="mt-3" asChild>
                <Link to="/admin/teachers">Thêm giáo viên</Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {teachers.map((teacher: any) => (
                <div
                  key={teacher.id}
                  className="flex items-center gap-4 rounded-lg border p-3 transition-colors hover:bg-muted/50"
                >
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={teacher.avatarUrl || undefined} />
                    <AvatarFallback className="bg-amber-500/10 text-amber-600">
                      <GraduationCap className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">
                      {teacher.fullName || "Chưa đặt tên"}
                    </p>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1 truncate">
                        <Mail className="h-3 w-3 flex-shrink-0" />
                        {teacher.email}
                      </span>
                      {teacher.phone && (
                        <span className="flex items-center gap-1">
                          <Phone className="h-3 w-3 flex-shrink-0" />
                          {teacher.phone}
                        </span>
                      )}
                    </div>
                  </div>
                  <Badge
                    variant={
                      teacher.isActive !== false ? "default" : "secondary"
                    }
                    className="flex-shrink-0"
                  >
                    {teacher.isActive !== false ? "Hoạt động" : "Tắt"}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
