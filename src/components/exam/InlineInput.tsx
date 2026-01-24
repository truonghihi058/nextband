import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { Check, X } from 'lucide-react';

interface InlineInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  showValidation?: boolean;
  isCorrect?: boolean;
  validationHint?: string;
  disabled?: boolean;
  className?: string;
  width?: 'sm' | 'md' | 'lg';
}

export function InlineInput({
  value,
  onChange,
  placeholder = 'Nhập đáp án',
  showValidation = false,
  isCorrect,
  validationHint,
  disabled = false,
  className,
  width = 'md',
}: InlineInputProps) {
  const widthClasses = {
    sm: 'w-20',
    md: 'w-32',
    lg: 'w-48',
  };

  return (
    <span className={cn('inline-flex items-center gap-1.5', className)}>
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className={cn(
          'inline-block h-8 px-2 text-center',
          widthClasses[width],
          showValidation &&
            isCorrect !== undefined &&
            (isCorrect
              ? 'border-[hsl(var(--success))] bg-[hsl(var(--success))]/10'
              : 'border-destructive bg-destructive/10')
        )}
      />
      {validationHint && (
        <span className="text-xs text-muted-foreground italic">{validationHint}</span>
      )}
      {showValidation && isCorrect !== undefined && (
        <span
          className={cn(
            'w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0',
            isCorrect ? 'bg-[hsl(var(--success))] text-white' : 'bg-destructive text-white'
          )}
        >
          {isCorrect ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
        </span>
      )}
    </span>
  );
}
