import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { Check, X } from 'lucide-react';

interface DropdownSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: string[];
  placeholder?: string;
  showValidation?: boolean;
  isCorrect?: boolean;
  disabled?: boolean;
  className?: string;
}

export function DropdownSelect({
  value,
  onChange,
  options,
  placeholder = 'Chọn đáp án',
  showValidation = false,
  isCorrect,
  disabled = false,
  className,
}: DropdownSelectProps) {
  return (
    <div className={cn('relative inline-flex items-center gap-2', className)}>
      <Select value={value} onValueChange={onChange} disabled={disabled}>
        <SelectTrigger
          className={cn(
            'w-[180px]',
            showValidation && isCorrect !== undefined && (isCorrect ? 'border-[hsl(var(--success))]' : 'border-destructive')
          )}
        >
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((opt) => (
            <SelectItem key={opt} value={opt}>
              {opt}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {showValidation && isCorrect !== undefined && (
        <span
          className={cn(
            'w-5 h-5 rounded-full flex items-center justify-center',
            isCorrect ? 'bg-[hsl(var(--success))] text-white' : 'bg-destructive text-white'
          )}
        >
          {isCorrect ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
        </span>
      )}
    </div>
  );
}
