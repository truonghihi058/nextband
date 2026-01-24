import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { BookOpen, Play, Clock } from 'lucide-react';
import type { Tables } from '@/integrations/supabase/types';

type Course = Tables<'courses'>;

interface CourseCardProps {
  course: Course;
  progress?: number;
  enrolled?: boolean;
}

const levelLabels: Record<string, string> = {
  beginner: 'Người mới',
  intermediate: 'Trung cấp',
  ielts_5: 'IELTS 5.0',
  ielts_5_5: 'IELTS 5.5',
  ielts_6: 'IELTS 6.0',
  ielts_6_5: 'IELTS 6.5',
  ielts_7: 'IELTS 7.0',
  ielts_7_5: 'IELTS 7.5',
  ielts_8: 'IELTS 8.0',
  ielts_8_5: 'IELTS 8.5',
  ielts_9: 'IELTS 9.0',
};

const levelColors: Record<string, string> = {
  beginner: 'bg-success/10 text-success border-success/20',
  intermediate: 'bg-info/10 text-info border-info/20',
  ielts_5: 'bg-primary/10 text-primary border-primary/20',
  ielts_5_5: 'bg-primary/10 text-primary border-primary/20',
  ielts_6: 'bg-secondary text-secondary-foreground',
  ielts_6_5: 'bg-secondary text-secondary-foreground',
  ielts_7: 'bg-accent/10 text-accent border-accent/20',
  ielts_7_5: 'bg-accent/10 text-accent border-accent/20',
  ielts_8: 'bg-warning/10 text-warning border-warning/20',
  ielts_8_5: 'bg-warning/10 text-warning border-warning/20',
  ielts_9: 'bg-destructive/10 text-destructive border-destructive/20',
};

export function CourseCard({ course, progress, enrolled }: CourseCardProps) {
  return (
    <Card className="group overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
      <div className="relative h-48 overflow-hidden">
        {course.thumbnail_url ? (
          <img
            src={course.thumbnail_url}
            alt={course.title}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/20 to-secondary flex items-center justify-center">
            <BookOpen className="h-16 w-16 text-primary/50" />
          </div>
        )}
        <Badge 
          className={`absolute top-3 right-3 ${levelColors[course.level] || 'bg-secondary text-secondary-foreground'}`}
        >
          {levelLabels[course.level] || course.level}
        </Badge>
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
        {enrolled && typeof progress === 'number' && (
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
          
          <Button size="sm" variant={enrolled ? 'default' : 'outline'} asChild>
            <Link to={`/course/${course.id}`}>
              {enrolled ? (
                <>
                  <Play className="mr-1 h-4 w-4" />
                  Tiếp tục
                </>
              ) : (
                'Xem chi tiết'
              )}
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
