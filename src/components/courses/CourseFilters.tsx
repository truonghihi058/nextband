import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search } from 'lucide-react';

interface CourseFiltersProps {
  levelFilter: string;
  onLevelChange: (value: string) => void;
  searchQuery: string;
  onSearchChange: (value: string) => void;
}

const levels = [
  { value: 'all', label: 'Tất cả cấp độ' },
  { value: 'beginner', label: 'Người mới' },
  { value: 'intermediate', label: 'Trung cấp' },
  { value: 'ielts_5', label: 'IELTS 5.0' },
  { value: 'ielts_5_5', label: 'IELTS 5.5' },
  { value: 'ielts_6', label: 'IELTS 6.0' },
  { value: 'ielts_6_5', label: 'IELTS 6.5' },
  { value: 'ielts_7', label: 'IELTS 7.0' },
  { value: 'ielts_7_5', label: 'IELTS 7.5' },
  { value: 'ielts_8', label: 'IELTS 8.0+' },
];

export function CourseFilters({ 
  levelFilter, 
  onLevelChange, 
  searchQuery, 
  onSearchChange 
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
      <Select value={levelFilter} onValueChange={onLevelChange}>
        <SelectTrigger className="w-full sm:w-[200px]">
          <SelectValue placeholder="Chọn cấp độ" />
        </SelectTrigger>
        <SelectContent>
          {levels.map((level) => (
            <SelectItem key={level.value} value={level.value}>
              {level.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
