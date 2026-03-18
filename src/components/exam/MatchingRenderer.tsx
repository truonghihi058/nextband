import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { GripVertical, X, CheckCircle2, Plus } from "lucide-react";

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

    // Local state for dragging (using the option's index or letter as ID)
    const [draggedOptionLetter, setDraggedOptionLetter] = useState<string | null>(null);

    // The answer for a matching question is an object: { "0": "A", "1": "B", ... }
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

    // Find which options are already used (assuming 1-to-1 matching for UI UX, even if backend allows multi)
    const usedOptionLetters = Object.values(currentAnswers) as string[];

    return (
        <div className="space-y-8 py-6">
            {/* Pool of Draggable Options (Answers) */}
            <div className="space-y-4">
                <div className="flex items-center justify-between px-1">
                    <h4 className="text-sm font-bold text-teal-700 uppercase tracking-widest flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-teal-500 animate-pulse" />
                        Danh sách lựa chọn
                    </h4>
                    <span className="text-xs text-muted-foreground">{data.options.length - usedOptionLetters.length} lựa chọn còn lại</span>
                </div>

                <div className="flex flex-wrap gap-3 p-6 bg-teal-50/50 rounded-2xl border-2 border-dashed border-teal-200/50 min-h-[100px] shadow-inner">
                    <AnimatePresence mode="popLayout">
                        {data.options.map((optionText, i) => {
                            const letter = String.fromCharCode(65 + i);
                            const isUsed = usedOptionLetters.includes(letter);
                            if (isUsed) return null;

                            return (
                                <motion.div
                                    key={letter}
                                    layout
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.5 }}
                                    whileHover={{ scale: 1.05, rotate: 1 }}
                                    whileTap={{ scale: 0.95, rotate: -1 }}
                                    draggable
                                    onDragStart={() => setDraggedOptionLetter(letter)}
                                    onDragEnd={() => setDraggedOptionLetter(null)}
                                    className="cursor-grab active:cursor-grabbing"
                                >
                                    <div className="bg-white border-2 border-teal-100 hover:border-teal-500 shadow-sm hover:shadow-md px-4 py-3 rounded-xl flex items-center gap-3 group transition-all duration-300">
                                        <div className="h-7 w-7 rounded-lg bg-teal-100 text-teal-700 flex items-center justify-center font-bold text-sm group-hover:bg-teal-500 group-hover:text-white transition-colors">
                                            {letter}
                                        </div>
                                        <span className="font-medium text-slate-700">{optionText}</span>
                                        <GripVertical className="h-4 w-4 text-slate-300 group-hover:text-teal-400 transition-colors" />
                                    </div>
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>

                    {data.options.length > 0 && data.options.every((_, i) => usedOptionLetters.includes(String.fromCharCode(65 + i))) && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="w-full flex flex-col items-center justify-center py-4 text-teal-600/60"
                        >
                            <CheckCircle2 className="h-8 w-8 mb-2 opacity-50" />
                            <p className="text-sm font-medium italic">Tất cả đáp án đã được nối!</p>
                        </motion.div>
                    )}
                </div>
            </div>

            {/* Grid of Matchable Items (Questions) */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
                {data.items.map((itemText, index) => {
                    const itemKey = String(index);
                    const matchedLetter = currentAnswers[itemKey];
                    const matchedOptionIndex = matchedLetter ? matchedLetter.charCodeAt(0) - 65 : -1;
                    const matchedOptionText = matchedOptionIndex >= 0 ? data.options[matchedOptionIndex] : "";

                    return (
                        <Card
                            key={itemKey}
                            className={cn(
                                "relative overflow-hidden transition-all duration-500 border-2 group",
                                matchedLetter
                                    ? "border-teal-500 bg-teal-50/30 shadow-lg shadow-teal-500/5 scale-[1.02]"
                                    : "border-slate-100 bg-white hover:border-teal-200 hover:shadow-xl",
                                draggedOptionLetter && !matchedLetter && "border-teal-400/50 border-dashed bg-teal-50/10 ring-4 ring-teal-500/5"
                            )}
                            onDragOver={(e) => {
                                e.preventDefault();
                                e.currentTarget.classList.add("ring-8", "ring-teal-500/10", "border-teal-500");
                            }}
                            onDragLeave={(e) => {
                                e.currentTarget.classList.remove("ring-8", "ring-teal-500/10", "border-teal-500");
                            }}
                            onDrop={(e) => {
                                e.preventDefault();
                                e.currentTarget.classList.remove("ring-8", "ring-teal-500/10", "border-teal-500");
                                if (draggedOptionLetter) {
                                    handleMatch(itemKey, draggedOptionLetter);
                                }
                            }}
                        >
                            <CardContent className="p-6 flex flex-col gap-5">
                                <div className="flex items-start justify-between">
                                    <div className="space-y-2 flex-1">
                                        <div className="flex items-center gap-2">
                                            <span className="px-2 py-0.5 rounded bg-slate-100 text-[10px] font-bold text-slate-500 uppercase tracking-tighter">
                                                CÂU HỎI {index + 1}
                                            </span>
                                            {matchedLetter && (
                                                <motion.span
                                                    initial={{ scale: 0 }}
                                                    animate={{ scale: 1 }}
                                                    className="flex items-center gap-1 text-[10px] font-semibold text-teal-600"
                                                >
                                                    <CheckCircle2 className="h-3 w-3" /> ĐÃ NỐI
                                                </motion.span>
                                            )}
                                        </div>
                                        <p className="text-slate-800 font-medium leading-relaxed italic">{itemText}</p>
                                    </div>
                                </div>

                                {/* Drop Zone / Result Zone */}
                                <div
                                    className={cn(
                                        "relative min-h-[64px] rounded-2xl border-2 border-dashed flex items-center justify-center transition-all px-4 py-3 group/slot",
                                        matchedLetter
                                            ? "border-teal-500 bg-white shadow-inner"
                                            : "border-slate-200 bg-slate-50/50 hover:bg-slate-50 hover:border-teal-300"
                                    )}
                                >
                                    {matchedLetter ? (
                                        <motion.div
                                            key={matchedLetter}
                                            initial={{ y: 20, opacity: 0 }}
                                            animate={{ y: 0, opacity: 1 }}
                                            className="flex items-center justify-between w-full"
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className="h-10 w-10 rounded-xl bg-teal-500 text-white flex items-center justify-center font-bold text-lg shadow-sm shadow-teal-200">
                                                    {matchedLetter}
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase leading-none mb-1">Đáp án đã chọn</span>
                                                    <span className="text-sm font-bold text-slate-700">{matchedOptionText}</span>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => handleMatch(itemKey, null)}
                                                className="h-8 w-8 rounded-full hover:bg-red-50 text-slate-300 hover:text-red-500 flex items-center justify-center transition-all duration-300 hover:rotate-90"
                                                title="Gỡ đáp án"
                                            >
                                                <X className="h-4 w-4" />
                                            </button>
                                        </motion.div>
                                    ) : (
                                        <div className="flex flex-col items-center gap-1 opacity-40 group-hover/slot:opacity-100 transition-opacity">
                                            <div className="h-8 w-8 rounded-xl bg-slate-200 border-2 border-slate-300 border-dashed flex items-center justify-center">
                                                <Plus className="h-4 w-4 text-slate-400" />
                                            </div>
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter uppercase leading-none">
                                                Kéo đáp án vào
                                            </span>
                                        </div>
                                    )}

                                    {/* Visual Drop Indicator */}
                                    {!matchedLetter && draggedOptionLetter && (
                                        <motion.div
                                            animate={{ opacity: [0.3, 0.6, 0.3] }}
                                            transition={{ repeat: Infinity, duration: 1.5 }}
                                            className="absolute inset-0 rounded-2xl bg-teal-500/5 border-2 border-teal-500"
                                        />
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-4 flex items-start gap-3">
                <div className="h-5 w-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-xs font-bold">!</span>
                </div>
                <p className="text-xs text-blue-600/80 leading-relaxed">
                    <strong>Mẹo:</strong> Bạn có thể kéo các thẻ chữ cái ở trên vào ô trống ở mỗi câu hỏi. Để chọn lại, hãy nhấn vào dấu X bên cạnh đáp án đã chọn.
                </p>
            </div>
        </div>
    );
};
