import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { GripVertical, X, CheckCircle2, Plus } from "lucide-react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

interface MatchingData {
    items: string[];
    options: string[];
    pairs: Record<string, string>;
}

interface MatchingRendererProps {
    question: any;
    answers: Record<string, any>;
    onAnswerChange: (questionId: string, answer: any) => void;
}

const parseMatchingData = (jsonStr: string | undefined): MatchingData => {
    if (!jsonStr) return { items: [], options: [], pairs: {} };
    try {
        const parsed = JSON.parse(jsonStr);
        return {
            items: parsed.items || [],
            options: parsed.options || [],
            pairs: parsed.pairs || {},
        };
    } catch {
        return { items: [], options: [], pairs: {} };
    }
};

export const MatchingRenderer = ({
    question,
    answers,
    onAnswerChange,
}: MatchingRendererProps) => {
    const data = useMemo(() => parseMatchingData(question.correctAnswer), [question.correctAnswer]);

    const [draggedOptionLetter, setDraggedOptionLetter] = useState<string | null>(null);

    const currentAnswers = useMemo(() => {
        const ans = answers[question.id];
        if (typeof ans === "string") {
            try {
                return JSON.parse(ans) || {};
            } catch {
                return {};
            }
        }
        return ans || {};
    }, [answers, question.id]);

    const handleMatch = (itemIndex: string, optionLetter: string | null) => {
        const newAnswers = { ...currentAnswers };
        if (optionLetter === null) {
            delete newAnswers[itemIndex];
        } else {
            newAnswers[itemIndex] = optionLetter;
        }
        onAnswerChange(question.id, newAnswers);
    };

    const usedOptionLetters = Object.values(currentAnswers) as string[];
    const availableOptionEntries = data.options
        .map((optionText, i) => ({
            letter: String.fromCharCode(65 + i),
            optionText,
        }))
        .filter(({ letter }) => !usedOptionLetters.includes(letter));
    const allUsed = data.options.length > 0 && availableOptionEntries.length === 0;

    const renderOptionLabel = (letter: string) => {
        const idx = letter.charCodeAt(0) - 65;
        const text = data.options[idx] || "";
        return `${letter}. ${text}`;
    };

    return (
        <div className="space-y-6 py-4">
            {/* Pool of Draggable Options */}
        <div className="space-y-2.5">
            <div className="flex items-center justify-between px-1 flex-wrap gap-2">
                <h4 className="text-sm font-bold text-teal-700 uppercase tracking-wide flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-teal-500" />
                    Danh sách lựa chọn
                </h4>
                <span className="text-xs text-muted-foreground">
                    {data.options.length - usedOptionLetters.length} lựa chọn còn lại
                </span>
            </div>

                <div className="flex flex-wrap gap-1.5 p-2.5 bg-teal-50/50 rounded-xl border-2 border-dashed border-teal-200/60 min-h-[56px]">
                    {data.options.map((optionText, i) => {
                        const letter = String.fromCharCode(65 + i);
                        const isUsed = usedOptionLetters.includes(letter);
                        if (isUsed) return null;
                        return (
                            <div
                                key={letter}
                                draggable
                                onDragStart={() => setDraggedOptionLetter(letter)}
                                onDragEnd={() => setDraggedOptionLetter(null)}
                                className="cursor-grab active:cursor-grabbing bg-white border-2 border-teal-100 hover:border-teal-400 shadow-sm hover:shadow-md px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 group transition-all duration-200 select-none max-w-full"
                            >
                                <div className="h-5 w-5 rounded-md bg-teal-100 text-teal-700 flex items-center justify-center font-bold text-[10px] group-hover:bg-teal-500 group-hover:text-white transition-colors flex-shrink-0">
                                    {letter}
                                </div>
                                <span className="font-medium text-slate-700 text-xs leading-tight max-w-[180px] sm:max-w-[240px] truncate">
                                    {optionText}
                                </span>
                                <GripVertical className="h-3.5 w-3.5 text-slate-300 group-hover:text-teal-400 transition-colors flex-shrink-0" />
                            </div>
                        );
                    })}
                    {allUsed && (
                        <div className="w-full flex flex-col items-center justify-center py-3 text-teal-600/60">
                            <CheckCircle2 className="h-6 w-6 mb-1 opacity-50" />
                            <p className="text-xs font-medium italic">Tất cả đáp án đã được nối!</p>
                        </div>
                    )}
                    {data.options.length === 0 && (
                        <p className="text-xs text-muted-foreground italic w-full text-center py-2">
                            Chưa có lựa chọn nào
                        </p>
                    )}
                </div>
            </div>

            {/* Matchable Items — responsive stack */}
            <div className="flex flex-col gap-2.5">
                {data.items.map((itemText, index) => {
                    const itemKey = String(index);
                    const matchedLetter = currentAnswers[itemKey];
                    const matchedOptionIndex = matchedLetter ? matchedLetter.charCodeAt(0) - 65 : -1;
                    const matchedOptionText = matchedOptionIndex >= 0 ? data.options[matchedOptionIndex] : "";
                    const isDragTarget = draggedOptionLetter && !matchedLetter;

                    return (
                        <Card
                            key={itemKey}
                        className={cn(
                            "transition-all duration-200 border-2",
                            matchedLetter
                                ? "border-teal-500 bg-teal-50/30"
                                : "border-slate-100 bg-white hover:border-teal-200",
                            isDragTarget && "border-teal-400 border-dashed bg-teal-50/10",
                        )}
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={(e) => {
                                e.preventDefault();
                                if (draggedOptionLetter) handleMatch(itemKey, draggedOptionLetter);
                            }}
                        >
                            <CardContent className="p-2.5 sm:p-3 flex flex-col sm:flex-row sm:items-start gap-2.5">
                                {/* Question label */}
                                <div className="flex-1 min-w-0">
                                    <span className="inline-block px-2 py-0.5 rounded bg-slate-100 text-[10px] font-bold text-slate-500 uppercase tracking-tighter mb-1.5">
                                        Câu hỏi {index + 1}
                                    </span>
                                    <p className="text-slate-800 font-medium leading-snug text-[13px] break-words">
                                        {itemText}
                                    </p>
                                </div>

                                {/* Arrow */}
                                <div className="hidden sm:flex items-start pt-1 text-slate-300 flex-shrink-0">
                                    <span className="text-lg leading-none">→</span>
                                </div>

                                {/* Drop slot */}
                                <div
                                    className={cn(
                                        "flex-shrink-0 sm:w-44 min-h-[40px] rounded-lg border-2 border-dashed flex items-center px-2.5 py-1.5 transition-all",
                                        matchedLetter
                                            ? "border-teal-500 bg-white"
                                            : "border-slate-200 bg-slate-50/50 hover:bg-slate-50 hover:border-teal-300",
                                        isDragTarget && "border-teal-400 bg-teal-50/20",
                                    )}
                                >
                                    {matchedLetter ? (
                                        <div className="flex items-center gap-2 w-full">
                                            <div className="h-7 w-7 rounded-lg bg-teal-500 text-white flex items-center justify-center font-bold text-xs shadow-sm flex-shrink-0">
                                                {matchedLetter}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <span className="text-[10px] font-bold text-slate-400 uppercase leading-none block">
                                                    Đã chọn
                                                </span>
                                                <span className="text-xs font-semibold text-slate-700 leading-tight line-clamp-2">
                                                    {matchedOptionText}
                                                </span>
                                            </div>
                                            <button
                                                onClick={() => handleMatch(itemKey, null)}
                                                className="h-6 w-6 rounded-full hover:bg-red-50 text-slate-300 hover:text-red-500 flex items-center justify-center transition-all flex-shrink-0"
                                                title="Gỡ đáp án"
                                            >
                                                <X className="h-3 w-3" />
                                            </button>
                                        </div>
                                ) : (
                                        <div className="flex flex-col gap-1.5 w-full">
                                            <div className="flex items-center gap-2 text-slate-400 w-full justify-center">
                                                <div className="h-6 w-6 rounded-lg bg-slate-100 border border-slate-200 border-dashed flex items-center justify-center flex-shrink-0">
                                                    <Plus className="h-3 w-3" />
                                                </div>
                                                <span className="text-[11px] font-medium">Kéo hoặc chọn</span>
                                            </div>

                                            <Select
                                                value=""
                                                onValueChange={(value) => handleMatch(itemKey, value)}
                                                disabled={availableOptionEntries.length === 0}
                                            >
                                                <SelectTrigger className="h-8 w-full text-xs bg-white">
                                                    <SelectValue placeholder={availableOptionEntries.length === 0 ? "Hết lựa chọn" : "Chọn đáp án"} />
                                                </SelectTrigger>
                                                <SelectContent className="z-[80] max-h-56">
                                                    {availableOptionEntries.map(({ letter }) => (
                                                        <SelectItem key={letter} value={letter}>
                                                            {renderOptionLabel(letter)}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            {data.items.length > 0 && (
                <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-3 flex items-start gap-2">
                    <div className="h-5 w-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 mt-0.5">
                        <span className="text-xs font-bold">!</span>
                    </div>
                    <p className="text-xs text-blue-600/80 leading-relaxed">
                        <strong>Mẹo:</strong> Kéo các thẻ chữ cái ở trên vào ô bên phải. Nhấn X để gỡ đáp án đã chọn.
                    </p>
                </div>
            )}
        </div>
    );
};
