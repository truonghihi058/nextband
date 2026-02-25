import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

interface CourseFiltersProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
}

export function CourseFilters({
  searchQuery,
  onSearchChange,
}: CourseFiltersProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-4">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Tìm kiếm khóa học..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10"
        />
      </div>
    </div>
  );
}
