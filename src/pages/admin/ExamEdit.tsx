import {
  useParams,
  useNavigate,
  Link,
  useSearchParams,
} from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { examsApi } from "@/lib/api";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Settings,
  Headphones,
  BookOpen,
  PenTool,
  Mic,
  Edit,
  FileText,
} from "lucide-react";
import ExamForm from "@/components/admin/ExamForm";

const sectionIcons = {
  listening: Headphones,
  reading: BookOpen,
  writing: PenTool,
  speaking: Mic,
  general: FileText,
};

const sectionColors = {
  listening: "bg-listening text-white",
  reading: "bg-reading text-white",
  writing: "bg-writing text-white",
  speaking: "bg-speaking text-white",
  general: "bg-primary text-primary-foreground",
};

export default function AdminExamEdit() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();

  const activeTab = searchParams.get("tab") || "info";

  const handleTabChange = (value: string) => {
    setSearchParams({ tab: value }, { replace: true });
  };

  const { data: examData, isLoading: examLoading } = useQuery({
    queryKey: ["exam", id],
    queryFn: () => examsApi.getById(id!),
    enabled: !!id,
  });

  const sections = examData?.sections || [];

  const handleBack = () => {
    if (examData?.courseId) {
      navigate(`/admin/courses/${examData.courseId}?tab=exams`);
    } else {
      navigate("/admin/exams");
    }
  };

  const handleSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ["admin-exams"] });
    queryClient.invalidateQueries({ queryKey: ["exam", id] });
  };

  if (!id) {
    return <div>ID không hợp lệ</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={handleBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-bold">Chỉnh sửa bài thi</h1>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={handleTabChange}
        className="space-y-6"
      >
        <TabsList>
          <TabsTrigger value="info" className="gap-2">
            <Settings className="h-4 w-4" />
            Thông tin
          </TabsTrigger>
          <TabsTrigger value="sections" className="gap-2">
            <BookOpen className="h-4 w-4" />
            Sections
          </TabsTrigger>
        </TabsList>

        <TabsContent value="info">
          <ExamForm mode="edit" examId={id} onSuccess={handleSuccess} />
        </TabsContent>

        <TabsContent value="sections">
          <Card>
            <CardHeader>
              <CardTitle>Quản lý Sections</CardTitle>
              <CardDescription>
                Chỉnh sửa nội dung từng phần thi
              </CardDescription>
            </CardHeader>
            <CardContent>
              {examLoading ? (
                <p className="text-muted-foreground">Đang tải...</p>
              ) : sections && sections.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2">
                  {sections.map((section: any) => {
                    const Icon =
                      sectionIcons[
                        section.sectionType as keyof typeof sectionIcons
                      ] || BookOpen;
                    const colorClass =
                      sectionColors[
                        section.sectionType as keyof typeof sectionColors
                      ] || "bg-muted";

                    return (
                      <Card
                        key={section.id}
                        className="hover:shadow-md transition-shadow"
                      >
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <Badge className={colorClass}>
                              <Icon className="mr-1 h-3 w-3" />
                              {section.sectionType.toUpperCase()}
                            </Badge>
                            <Button variant="outline" size="sm" asChild>
                              <Link to={`/admin/sections/${section.id}`}>
                                <Edit className="h-4 w-4 mr-1" />
                                Chỉnh sửa
                              </Link>
                            </Button>
                          </div>
                          <CardTitle className="text-lg mt-2">
                            {section.title}
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-sm text-muted-foreground space-y-1">
                            {section.durationMinutes && (
                              <p>Thời gian: {section.durationMinutes} phút</p>
                            )}
                            {section.instructions && (
                              <p className="line-clamp-2">
                                {section.instructions}
                              </p>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              ) : (
                <p className="text-center py-8 text-muted-foreground">
                  Chưa có section nào. Hãy tạo lại bài thi để khởi tạo 4
                  sections mặc định.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
