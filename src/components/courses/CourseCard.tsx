import { Link } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { BookOpen, Play } from "lucide-react";

interface Course {
  id: string;
  title: string;
  description?: string | null;
  thumbnailUrl?: string | null;
  price?: number | null;
  isPublished?: boolean;
  isActive?: boolean;
}

interface CourseCardProps {
  course: Course;
  progress?: number;
  enrolled?: boolean;
}

export function CourseCard({ course, progress, enrolled }: CourseCardProps) {
  return (
    <Card className="group overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
      <div className="relative h-48 overflow-hidden">
        {course.thumbnailUrl ? (
          <img
            src={course.thumbnailUrl}
            alt={course.title}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/20 to-secondary flex items-center justify-center">
            <BookOpen className="h-16 w-16 text-primary/50" />
          </div>
        )}
      </div>

      <CardHeader className="pb-2">
        <CardTitle className="line-clamp-2 text-lg group-hover:text-primary transition-colors">
          {course.title}
        </CardTitle>
        {course.description && (
          <CardDescription className="line-clamp-2">
            {course.description}
          </CardDescription>
        )}
      </CardHeader>

      <CardContent>
        {enrolled && typeof progress === "number" && (
          <div className="mb-4">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-muted-foreground">Tiến độ</span>
              <span className="font-medium">{progress}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        )}

        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            {course.price ? (
              <span className="font-semibold text-foreground">
                {course.price.toLocaleString()} VND
              </span>
            ) : (
              <span className="text-success font-medium">Miễn phí</span>
            )}
          </div>

          <Button size="sm" variant={enrolled ? "default" : "outline"} asChild>
            <Link to={`/course/${course.id}`}>
              {enrolled ? (
                <>
                  <Play className="mr-1 h-4 w-4" />
                  Tiếp tục
                </>
              ) : (
                "Xem chi tiết"
              )}
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
