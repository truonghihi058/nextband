import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { classesApi, usersApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  ArrowLeft,
  Loader2,
  Save,
  UserPlus,
  Trash2,
  Search,
  Users,
  GraduationCap,
  Mail,
  Calendar,
  ClipboardCheck,
  Clock3,
} from "lucide-react";
import DeleteConfirmDialog from "@/components/admin/DeleteConfirmDialog";

const DAY_OPTIONS = [
  { value: 1, label: "Thứ 2" },
  { value: 2, label: "Thứ 3" },
  { value: 3, label: "Thứ 4" },
  { value: 4, label: "Thứ 5" },
  { value: 5, label: "Thứ 6" },
  { value: 6, label: "Thứ 7" },
  { value: 0, label: "Chủ nhật" },
];

export default function AdminClassEdit() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [teacherId, setTeacherId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [initialized, setInitialized] = useState(false);

  // Add students dialog
  const [addStudentsOpen, setAddStudentsOpen] = useState(false);
  const [studentSearch, setStudentSearch] = useState("");
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);

  // Delete student confirm
  const [removeStudent, setRemoveStudent] = useState<{
    id: string;
    name: string;
  } | null>(null);

  // Schedule state
  const [scheduleDay, setScheduleDay] = useState("1");
  const [scheduleStartTime, setScheduleStartTime] = useState("19:00");
  const [scheduleDuration, setScheduleDuration] = useState("120");
  const [scheduleTimezone, setScheduleTimezone] = useState("Asia/Ho_Chi_Minh");

  // Attendance state
  const [sessionDate, setSessionDate] = useState(
    new Date().toISOString().slice(0, 10),
  );
  const [attendanceDraft, setAttendanceDraft] = useState<
    Record<
      string,
      { status: "present" | "absent" | "inactive"; note?: string }
    >
  >({});

  // Fetch class detail
  const { data: classData, isLoading } = useQuery({
    queryKey: ["admin-class", id],
    queryFn: () => classesApi.getById(id!),
    enabled: !!id,
  });

  // Fetch teachers list for dropdown
  const { data: teachersData } = useQuery({
    queryKey: ["teachers-list"],
    queryFn: () => usersApi.list({ role: "teacher", limit: 100 }),
  });

  const teachers = teachersData?.data || [];

  // Initialize form when data loads
  useEffect(() => {
    if (!classData || initialized) return;
    setName(classData.name || "");
    setDescription(classData.description || "");
    setTeacherId(classData.teacherId || classData.teacher?.id || "");
    setStartDate(
      classData.startDate
        ? new Date(classData.startDate).toISOString().split("T")[0]
        : "",
    );
    setEndDate(
      classData.endDate
        ? new Date(classData.endDate).toISOString().split("T")[0]
        : "",
    );
    setInitialized(true);
  }, [classData, initialized]);

  // Fetch students for the add-students dialog
  const { data: usersData, isLoading: usersLoading } = useQuery({
    queryKey: ["users-students", studentSearch],
    queryFn: () =>
      usersApi.list({
        page: 1,
        limit: 50,
        search: studentSearch || undefined,
        role: "student",
      }),
    enabled: addStudentsOpen,
  });

  const { data: schedulesData, isLoading: schedulesLoading } = useQuery({
    queryKey: ["class-schedules", id],
    queryFn: () => classesApi.listSchedules(id!),
    enabled: !!id,
    retry: false,
  });

  const {
    data: attendanceData,
    isLoading: attendanceLoading,
    refetch: refetchAttendance,
  } = useQuery({
    queryKey: ["class-attendance", id, sessionDate],
    queryFn: () => classesApi.getAttendance(id!, sessionDate),
    enabled: !!id && !!sessionDate,
    retry: false,
  });

  const {
    data: attendanceHistory,
    isLoading: historyLoading,
    refetch: refetchAttendanceHistory,
  } = useQuery({
    queryKey: ["class-attendance-history", id],
    queryFn: () => classesApi.getAttendanceHistory(id!),
    enabled: !!id,
  });

  // Update class mutation
  const updateMutation = useMutation({
    mutationFn: (body: {
      name?: string;
      description?: string;
      teacherId?: string | null;
      startDate?: string | null;
      endDate?: string | null;
    }) => classesApi.update(id!, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-class", id] });
      queryClient.invalidateQueries({ queryKey: ["admin-classes"] });
      toast({ title: "Đã cập nhật lớp học" });
    },
    onError: () => {
      toast({
        title: "Lỗi",
        description: "Không thể cập nhật",
        variant: "destructive",
      });
    },
  });

  // Add students mutation
  const addStudentsMutation = useMutation({
    mutationFn: (studentIds: string[]) =>
      classesApi.addStudents(id!, studentIds),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["admin-class", id] });
      toast({
        title: "Đã thêm học viên",
        description: `${data.added} học viên được thêm vào lớp`,
      });
      setAddStudentsOpen(false);
      setSelectedStudents([]);
    },
    onError: () => {
      toast({
        title: "Lỗi",
        description: "Không thể thêm học viên",
        variant: "destructive",
      });
    },
  });

  // Remove student mutation
  const removeStudentMutation = useMutation({
    mutationFn: (studentId: string) => classesApi.removeStudent(id!, studentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-class", id] });
      toast({ title: "Đã xóa học viên khỏi lớp" });
      setRemoveStudent(null);
    },
  });

  const createScheduleMutation = useMutation({
    mutationFn: () =>
      classesApi.createSchedule(id!, {
        dayOfWeek: Number(scheduleDay),
        startTime: scheduleStartTime,
        durationMinutes: Number(scheduleDuration),
        timezone: scheduleTimezone,
        isActive: true,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["class-schedules", id] });
      toast({ title: "Đã thêm lịch học" });
    },
    onError: (err: any) => {
      const message =
        err?.response?.data?.error || "Không thể thêm lịch học";
      toast({
        title: "Lỗi",
        description: message,
        variant: "destructive",
      });
    },
  });

  const deleteScheduleMutation = useMutation({
    mutationFn: (scheduleId: string) => classesApi.deleteSchedule(id!, scheduleId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["class-schedules", id] });
      toast({ title: "Đã xóa lịch học" });
    },
  });

  const saveAttendanceMutation = useMutation({
    mutationFn: () =>
      classesApi.upsertAttendance(id!, {
        sessionDate,
        records: Object.entries(attendanceDraft).map(([studentId, value]) => ({
          studentId,
          status: value.status,
          note: value.note || "",
        })),
      }),
    onSuccess: async () => {
      queryClient.invalidateQueries({
        queryKey: ["class-attendance", id, sessionDate],
      });
      queryClient.invalidateQueries({
        queryKey: ["class-attendance-history", id],
      });
      await Promise.all([refetchAttendance(), refetchAttendanceHistory()]);
      toast({ title: "Đã lưu điểm danh" });
    },
    onError: () => {
      toast({
        title: "Lỗi",
        description: "Không thể lưu điểm danh",
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    const students = attendanceData?.students || [];
    const next: Record<
      string,
      { status: "present" | "absent" | "inactive"; note?: string }
    > = {};

    students.forEach((student: any) => {
      next[student.studentId] = {
        status: (student.status || "absent") as
          | "present"
          | "absent"
          | "inactive",
        note: student.note || "",
      };
    });

    setAttendanceDraft(next);
  }, [attendanceData]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!classData) {
    return <div className="text-center py-8">Lớp học không tồn tại</div>;
  }

  // Students already in class
  const existingStudentIds = new Set(
    (classData.students || []).map((s: any) => s.studentId),
  );

  // Available students (not yet in class)
  const availableStudents = (usersData?.data || []).filter(
    (u: any) => !existingStudentIds.has(u.id),
  );

  // Find current teacher info
  const currentTeacher = teachers.find((t: any) => t.id === teacherId);

  const handleSave = () => {
    if (startDate && endDate) {
      const start = new Date(startDate).getTime();
      const end = new Date(endDate).getTime();
      if (Number.isFinite(start) && Number.isFinite(end) && start > end) {
        toast({
          title: "Lỗi",
          description: "Ngày bắt đầu không được lớn hơn ngày kết thúc",
          variant: "destructive",
        });
        return;
      }
    }
    updateMutation.mutate({
      name,
      description,
      teacherId: teacherId || null,
      startDate: startDate || null,
      endDate: endDate || null,
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/admin/classes")}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">{classData.name}</h1>
          <p className="text-sm text-muted-foreground">
            Giáo viên: {classData.teacher?.fullName || "Chưa có"} •{" "}
            {classData.students?.length || 0} học viên
          </p>
        </div>
      </div>

      {/* General Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Thông tin lớp</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Tên lớp *</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="VD: IELTS Foundation 01"
              />
            </div>

            {/* Teacher Select */}
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5">
                <GraduationCap className="h-3.5 w-3.5" />
                Giáo viên phụ trách
              </Label>
              <Select value={teacherId} onValueChange={(v) => setTeacherId(v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Chọn giáo viên">
                    {currentTeacher ? (
                      <div className="flex items-center gap-2">
                        <GraduationCap className="h-3.5 w-3.5 text-amber-500" />
                        <span>
                          {currentTeacher.fullName || currentTeacher.email}
                        </span>
                      </div>
                    ) : teacherId ? (
                      <span>
                        {classData.teacher?.fullName ||
                          classData.teacher?.email ||
                          "Giáo viên"}
                      </span>
                    ) : (
                      "Chọn giáo viên"
                    )}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {teachers.map((t: any) => (
                    <SelectItem key={t.id} value={t.id}>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={t.avatarUrl || undefined} />
                          <AvatarFallback className="bg-amber-500/10 text-amber-600 text-xs">
                            <GraduationCap className="h-3 w-3" />
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                          <span className="font-medium">
                            {t.fullName || "Chưa đặt tên"}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {t.email}
                          </span>
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Dates */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                Ngày bắt đầu
              </Label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                Ngày kết thúc
              </Label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Mô tả</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Mô tả lớp học..."
              rows={3}
            />
          </div>
          <Button
            onClick={handleSave}
            disabled={!name || updateMutation.isPending}
          >
            {updateMutation.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Lưu thay đổi
          </Button>
        </CardContent>
      </Card>

      {/* Weekly Schedule */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Clock3 className="h-5 w-5" />
            Lịch học cố định
          </CardTitle>
          <CardDescription>
            Thiết lập lịch lặp theo tuần cho lớp học
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-4">
            <div className="space-y-2">
              <Label>Ngày học</Label>
              <Select value={scheduleDay} onValueChange={setScheduleDay}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DAY_OPTIONS.map((day) => (
                    <SelectItem key={day.value} value={String(day.value)}>
                      {day.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Bắt đầu</Label>
              <Input
                type="time"
                value={scheduleStartTime}
                onChange={(e) => setScheduleStartTime(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Thời lượng (phút)</Label>
              <Input
                type="number"
                min={15}
                max={600}
                value={scheduleDuration}
                onChange={(e) => setScheduleDuration(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Timezone</Label>
              <Input
                value={scheduleTimezone}
                onChange={(e) => setScheduleTimezone(e.target.value)}
              />
            </div>
          </div>
          <div className="flex justify-end">
            <Button
              onClick={() => createScheduleMutation.mutate()}
              disabled={createScheduleMutation.isPending}
            >
              {createScheduleMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Thêm lịch học
            </Button>
          </div>

          {schedulesLoading ? (
            <div className="text-sm text-muted-foreground">Đang tải lịch học...</div>
          ) : (schedulesData?.data || []).length === 0 ? (
            <div className="text-sm text-muted-foreground">
              Chưa có lịch học nào.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ngày</TableHead>
                  <TableHead>Bắt đầu</TableHead>
                  <TableHead>Thời lượng</TableHead>
                  <TableHead>Timezone</TableHead>
                  <TableHead className="w-[90px]">Xóa</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(schedulesData?.data || []).map((schedule: any) => {
                  const day = DAY_OPTIONS.find((d) => d.value === schedule.dayOfWeek);
                  return (
                    <TableRow key={schedule.id}>
                      <TableCell>{day?.label || "—"}</TableCell>
                      <TableCell>{schedule.startTime}</TableCell>
                      <TableCell>{schedule.durationMinutes} phút</TableCell>
                      <TableCell>{schedule.timezone}</TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          onClick={() => deleteScheduleMutation.mutate(schedule.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Attendance */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <ClipboardCheck className="h-5 w-5" />
            Điểm danh theo buổi
          </CardTitle>
          <CardDescription>
            Chỉ cần chọn ngày và đánh dấu nhanh trạng thái từng học viên
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-end gap-3">
            <div className="space-y-2">
              <Label>Ngày học</Label>
              <Input
                type="date"
                value={sessionDate}
                onChange={(e) => setSessionDate(e.target.value)}
              />
            </div>
            <Button
              variant="outline"
              onClick={() => {
                const next = { ...attendanceDraft };
                Object.keys(next).forEach((studentId) => {
                  next[studentId] = { ...next[studentId], status: "present" };
                });
                setAttendanceDraft(next);
              }}
            >
              Đánh dấu tất cả Có mặt
            </Button>
            <Button
              onClick={() => saveAttendanceMutation.mutate()}
              disabled={saveAttendanceMutation.isPending}
            >
              {saveAttendanceMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Lưu điểm danh
            </Button>
          </div>

          {attendanceLoading ? (
            <div className="text-sm text-muted-foreground">Đang tải điểm danh...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Học viên</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead>Ghi chú</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(attendanceData?.students || []).map((student: any) => (
                  <TableRow key={student.studentId}>
                    <TableCell className="font-medium">{student.fullName}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {student.email}
                    </TableCell>
                    <TableCell className="w-[160px]">
                      <Select
                        value={attendanceDraft[student.studentId]?.status || "absent"}
                        onValueChange={(value: "present" | "absent" | "inactive") =>
                          setAttendanceDraft((prev) => ({
                            ...prev,
                            [student.studentId]: {
                              status: value,
                              note: prev[student.studentId]?.note || "",
                            },
                          }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="present">Có mặt</SelectItem>
                          <SelectItem value="absent">Vắng</SelectItem>
                          <SelectItem value="inactive">Tạm nghỉ</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Input
                        value={attendanceDraft[student.studentId]?.note || ""}
                        onChange={(e) =>
                          setAttendanceDraft((prev) => ({
                            ...prev,
                            [student.studentId]: {
                              status: prev[student.studentId]?.status || "absent",
                              note: e.target.value,
                            },
                          }))
                        }
                        placeholder="Ghi chú..."
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Attendance history */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Lịch sử điểm danh</CardTitle>
          <CardDescription>
            Bảng theo ngày (cột là buổi học, hàng là học viên) + tổng kết chuyên cần
          </CardDescription>
        </CardHeader>
        <CardContent>
          {historyLoading ? (
            <div className="text-sm text-muted-foreground">
              Đang tải lịch sử điểm danh...
            </div>
          ) : attendanceHistory?.sessionDates?.length ? (
            <Table className="overflow-x-auto">
              <TableHeader>
                <TableRow>
                  <TableHead>Học viên</TableHead>
                  {attendanceHistory.sessionDates.map((d: string) => (
                    <TableHead key={d} className="text-center whitespace-nowrap">
                      {d}
                    </TableHead>
                  ))}
                  <TableHead className="text-center whitespace-nowrap">
                    Có mặt
                  </TableHead>
                  <TableHead className="text-center whitespace-nowrap">
                    Vắng
                  </TableHead>
                  <TableHead className="text-center whitespace-nowrap">
                    Tỷ lệ
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(attendanceHistory.students || []).map((s: any) => {
                  const summary = s.summary || {};
                  const rate =
                    summary.attendanceRate != null
                      ? Math.round(summary.attendanceRate * 100)
                      : 0;
                  return (
                    <TableRow key={s.studentId}>
                      <TableCell className="font-medium whitespace-nowrap">
                        {s.fullName}
                      </TableCell>
                      {attendanceHistory.sessionDates.map((d: string) => {
                        const status = s.statuses?.[d];
                        const symbol =
                          status === "present"
                            ? "✓"
                            : status === "absent"
                            ? "✗"
                            : status === "inactive"
                            ? "–"
                            : "";
                        return (
                          <TableCell
                            key={d}
                            className="text-center text-sm font-semibold"
                          >
                            {symbol}
                          </TableCell>
                        );
                      })}
                      <TableCell className="text-center text-sm">
                        {summary.present ?? 0}
                      </TableCell>
                      <TableCell className="text-center text-sm">
                        {summary.absent ?? 0}
                      </TableCell>
                      <TableCell
                        className={`text-center text-sm ${
                          rate >= 80 ? "text-emerald-600" : "text-amber-600"
                        }`}
                      >
                        {rate}%
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          ) : (
            <div className="text-sm text-muted-foreground">
              Chưa có dữ liệu điểm danh để hiển thị.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Student Management */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="h-5 w-5" />
                Danh sách học viên
              </CardTitle>
              <CardDescription>
                {classData.students?.length || 0} học viên trong lớp
              </CardDescription>
            </div>
            <Button onClick={() => setAddStudentsOpen(true)}>
              <UserPlus className="mr-2 h-4 w-4" />
              Thêm học viên
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {classData.students?.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Chưa có học viên nào trong lớp. Bấm "Thêm học viên" để bắt đầu.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Họ tên</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Ngày tham gia</TableHead>
                  <TableHead className="w-[80px]">Xoá</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(classData.students || []).map((cs: any) => (
                  <TableRow key={cs.id}>
                    <TableCell className="font-medium">
                      {cs.student?.fullName || "—"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {cs.student?.email}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {new Date(cs.joinedAt).toLocaleDateString("vi-VN")}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() =>
                          setRemoveStudent({
                            id: cs.studentId,
                            name: cs.student?.fullName || cs.student?.email,
                          })
                        }
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Add Students Dialog */}
      <Dialog open={addStudentsOpen} onOpenChange={setAddStudentsOpen}>
        <DialogContent className="max-w-lg max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Thêm học viên vào lớp</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Tìm theo tên hoặc email..."
                value={studentSearch}
                onChange={(e) => setStudentSearch(e.target.value)}
                className="pl-10"
              />
            </div>

            {selectedStudents.length > 0 && (
              <Badge variant="secondary">
                Đã chọn: {selectedStudents.length} học viên
              </Badge>
            )}

            <div className="flex-1 overflow-y-auto border rounded-md max-h-[350px]">
              {usersLoading ? (
                <div className="text-center py-4 text-muted-foreground">
                  Đang tải...
                </div>
              ) : availableStudents.length === 0 ? (
                <div className="text-center py-4 text-muted-foreground">
                  Không tìm thấy học viên nào
                </div>
              ) : (
                <div className="divide-y">
                  {availableStudents.map((user: any) => (
                    <label
                      key={user.id}
                      className="flex items-center gap-3 p-3 hover:bg-muted/50 cursor-pointer"
                    >
                      <Checkbox
                        checked={selectedStudents.includes(user.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedStudents([...selectedStudents, user.id]);
                          } else {
                            setSelectedStudents(
                              selectedStudents.filter((id) => id !== user.id),
                            );
                          }
                        }}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">
                          {user.fullName || "Chưa có tên"}
                        </p>
                        <p className="text-sm text-muted-foreground truncate">
                          {user.email}
                        </p>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setAddStudentsOpen(false);
                setSelectedStudents([]);
              }}
            >
              Hủy
            </Button>
            <Button
              onClick={() => addStudentsMutation.mutate(selectedStudents)}
              disabled={
                selectedStudents.length === 0 || addStudentsMutation.isPending
              }
            >
              {addStudentsMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Thêm {selectedStudents.length} học viên
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Remove Student Confirm */}
      <DeleteConfirmDialog
        open={!!removeStudent}
        onOpenChange={(open) => !open && setRemoveStudent(null)}
        onConfirm={() =>
          removeStudent && removeStudentMutation.mutate(removeStudent.id)
        }
        loading={removeStudentMutation.isPending}
        title="Xóa học viên khỏi lớp?"
        description={`Bạn có chắc chắn muốn xóa "${removeStudent?.name}" khỏi lớp này?`}
      />
    </div>
  );
}
