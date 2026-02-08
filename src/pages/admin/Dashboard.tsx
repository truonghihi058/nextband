import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { statsApi } from "@/lib/api";
import { BookOpen, Users, FileText } from "lucide-react";

export default function AdminDashboard() {
  const { data: stats } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: () => statsApi.getAdminStats(),
  });

  const statCards = [
    {
      title: "Tổng khóa học",
      value: stats?.courses || 0,
      icon: BookOpen,
      color: "text-primary",
    },
    {
      title: "Tổng người dùng",
      value: stats?.users || 0,
      icon: Users,
      color: "text-info",
    },
    {
      title: "Tổng bài thi",
      value: stats?.exams || 0,
      icon: FileText,
      color: "text-success",
    },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <div className="grid gap-4 md:grid-cols-3">
        {statCards.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <stat.icon className={`h-5 w-5 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
