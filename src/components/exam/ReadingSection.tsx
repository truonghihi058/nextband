import {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
  MutableRefObject,
} from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  BookOpen,
  Highlighter,
  List,
  Pencil,
  Trash2,
  CheckSquare,
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useTextHighlight, Highlight } from "@/hooks/useTextHighlight";
import { cn } from "@/lib/utils";
import { DropdownSelect } from "./DropdownSelect";
import { RichContent } from "./RichContent";

import {
  FillBlankHtmlRenderer,
  FILL_BLANK_PLACEHOLDER_REGEX,
  hasFillBlankPlaceholders,
} from "./FillBlankHtmlRenderer";
import { MatchingRenderer } from "./MatchingRenderer";

interface ReadingSectionProps {
  section: any;
  answers: Record<string, any>;
  onAnswerChange: (questionId: string, answer: any) => void;
  questionRefs?: MutableRefObject<Map<string, HTMLElement>>;
  currentQuestionId?: string;
  onQuestionFocus?: (questionId: string) => void;
}

const containsHtml = (text: string) => /<[^>]+>/.test(text);
const normalizeText = (text: string) =>
  text.replace(/\s+/g, " ").replace(/\u00a0/g, " ").trim();
const stripHtml = (text: string) => (text || "").replace(/<[^>]*>/g, " ");
const normalizeForCompare = (text: string) =>
  stripHtml(text)
    .replace(/\u00a0/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
const isLikelyDuplicateWithPassage = (questionText: string, passage: string) => {
  const q = normalizeForCompare(questionText);
  const p = normalizeForCompare(passage);
  if (!q || !p) return false;
  if (q.length < 40 || p.length < 40) return false;
  return q === p || q.includes(p) || p.includes(q);
};
const getBlankKeysFromQuestionText = (text: string): string[] => {
  if (!text) return [];
  const plain = stripHtml(text);
  const regex = new RegExp(FILL_BLANK_PLACEHOLDER_REGEX.source, "g");
  const matches = Array.from(plain.matchAll(regex));
  const keys: string[] = [];
  let implicitIndex = 0;

  matches.forEach((match) => {
    const raw = match[0] || "";
    const indexMatch = raw.match(/^\[BLANK_(\d+)\]$/);
    if (indexMatch) {
      keys.push(String(Math.max(0, Number(indexMatch[1]) - 1)));
      return;
    }
    keys.push(String(implicitIndex));
    implicitIndex++;
  });

  return Array.from(new Set(keys));
};
const toPlainTextWithParagraphs = (html: string) => {
  if (!html) return "";
  // Preserve line/paragraph boundaries from rich text HTML.
  const withBreakHints = html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|li|h1|h2|h3|h4|h5|h6|blockquote|pre)>/gi, "\n\n");
  const parser = new DOMParser();
  const doc = parser.parseFromString(withBreakHints, "text/html");
  return (doc.body.textContent || "")
    .replace(/\u00a0/g, " ")
    .replace(/\n{3,}/g, "\n\n");
};

export function ReadingSection({
  section,
  answers,
  onAnswerChange,
  questionRefs,
  currentQuestionId,
  onQuestionFocus,
}: ReadingSectionProps) {
  const passageRef = useRef<HTMLDivElement>(null);
  const passageContentRef = useRef<HTMLDivElement>(null);
  const [pendingHighlight, setPendingHighlight] = useState<{
    text: string;
    startIndex: number;
    endIndex: number;
  } | null>(null);
  const [showHighlightMenu, setShowHighlightMenu] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });
  const [newHighlightColor, setNewHighlightColor] = useState<"yellow" | "green">(
    "yellow",
  );
  const [activeHighlightId, setActiveHighlightId] = useState<string | null>(
    null,
  );
  const [passageSourceText, setPassageSourceText] = useState("");
  const [leftTab, setLeftTab] = useState<"passage" | "highlights">("passage");
  const markRefs = useRef<Map<string, HTMLElement>>(new Map());
  const {
    highlights,
    addHighlight,
    removeHighlight,
    updateHighlightColor,
    loadHighlights,
  } = useTextHighlight(section.id);

  // Normalize question groups and their fields from camelCase to snake_case
  const questionGroups = (
    section.question_groups ||
    section.questionGroups ||
    []
  )
    .map((g: any) => ({
      ...g,
      questions: (g.questions || [])
        .map((q: any) => ({
          ...q,
          question_text: q.question_text || q.questionText || "",
          question_type: q.question_type || q.questionType || "short_answer",
          question_audio_url:
            q.audioUrl || q.audio_url || q.question_audio_url || null,
          order_index: q.order_index ?? q.orderIndex ?? 0,
          correct_answer: q.correct_answer || q.correctAnswer || null,
          options: q.options
            ? typeof q.options === "string"
              ? JSON.parse(q.options)
              : q.options
            : [],
        }))
        .sort((a: any, b: any) => {
          const orderDiff = (a.order_index || 0) - (b.order_index || 0);
          if (orderDiff !== 0) return orderDiff;
          // Secondary sort by createdAt to maintain insertion order if index is the same
          return (
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          );
        }),
    }))
    .sort((a: any, b: any) => {
      const orderDiff =
        (a.order_index || a.orderIndex || 0) -
        (b.order_index || b.orderIndex || 0);
      if (orderDiff !== 0) return orderDiff;
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    });

  // Get passage text from first question group or section
  const passageText = questionGroups[0]?.passage || section.passage_text || "";
  const passagePlainFromSource = useMemo(() => {
    if (!passageText) return "";
    if (!containsHtml(passageText)) return passageText;
    if (typeof window === "undefined") {
      return passageText
        .replace(/<br\s*\/?>/gi, "\n")
        .replace(/<\/(p|div|li|h1|h2|h3|h4|h5|h6|blockquote|pre)>/gi, "\n\n")
        .replace(/<[^>]*>/g, " ");
    }
    return toPlainTextWithParagraphs(passageText);
  }, [passageText]);
  const sortedHighlights = [...highlights].sort(
    (a, b) => a.startIndex - b.startIndex,
  );

  useEffect(() => {
    if (section.id) {
      loadHighlights(section.id);
    }
  }, [section.id, loadHighlights]);

  useEffect(() => {
    if (passageContentRef.current) {
      setPassageSourceText(
        passageContentRef.current.innerText ||
          passageContentRef.current.textContent ||
          passagePlainFromSource ||
          "",
      );
      return;
    }
    setPassageSourceText(passagePlainFromSource || "");
  }, [passagePlainFromSource, leftTab, highlights.length]);

  useEffect(() => {
    if (sortedHighlights.length === 0 && leftTab === "highlights") {
      setLeftTab("passage");
    }
  }, [leftTab, sortedHighlights.length]);

  const getRangeOffsets = useCallback((range: Range) => {
    if (!passageContentRef.current) return null;
    if (!passageContentRef.current.contains(range.commonAncestorContainer)) {
      return null;
    }
    const preRange = range.cloneRange();
    preRange.selectNodeContents(passageContentRef.current);
    preRange.setEnd(range.startContainer, range.startOffset);
    const startIndex = preRange.toString().length;
    const selected = range.toString();
    const endIndex = startIndex + selected.length;
    return { startIndex, endIndex, text: selected };
  }, []);

  const handleTextSelection = useCallback(() => {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed || !passageContentRef.current) {
      setShowHighlightMenu(false);
      return;
    }

    const rawText = selection.toString();
    const text = rawText.trim();
    if (!text) {
      setShowHighlightMenu(false);
      return;
    }

    const range = selection.getRangeAt(0);
    const offsets = getRangeOffsets(range);
    if (!offsets) {
      setShowHighlightMenu(false);
      return;
    }

    if (offsets.endIndex > offsets.startIndex) {
      const rect = range.getBoundingClientRect();
      setPendingHighlight({
        text: offsets.text,
        startIndex: offsets.startIndex,
        endIndex: offsets.endIndex,
      });
      setMenuPosition({
        x: rect.left + rect.width / 2,
        y: rect.top - 10,
      });
      setNewHighlightColor("yellow");
      setShowHighlightMenu(true);
    }
  }, [
    getRangeOffsets,
  ]);

  const handleSaveHighlight = useCallback(async () => {
    if (!pendingHighlight) return;
    const sourceText = passageSourceText || passagePlainFromSource;
    const sourceSlice = sourceText.slice(
      pendingHighlight.startIndex,
      pendingHighlight.endIndex,
    );
    const normalizedSelected = normalizeText(pendingHighlight.text);
    const normalizedSlice = normalizeText(sourceSlice);

    if (import.meta.env.DEV) {
      console.debug("[ReadingSection][highlight save]", {
        start: pendingHighlight.startIndex,
        end: pendingHighlight.endIndex,
        selectedText: pendingHighlight.text,
        sourceSlice,
        normalizedSelected,
        normalizedSlice,
        exactMatch: normalizedSelected === normalizedSlice,
      });
    }

    await addHighlight({
      startIndex: pendingHighlight.startIndex,
      endIndex: pendingHighlight.endIndex,
      color: newHighlightColor,
      highlightText: sourceSlice || pendingHighlight.text,
      passageId: questionGroups[0]?.id || section.id,
    });
    setActiveHighlightId(null);
    setPendingHighlight(null);
    setShowHighlightMenu(false);
    window.getSelection()?.removeAllRanges();
  }, [
    addHighlight,
    newHighlightColor,
    passagePlainFromSource,
    passageSourceText,
    pendingHighlight,
    questionGroups,
    section.id,
  ]);

  const getHighlightPreview = useCallback(
    (highlight: Highlight) => {
      const safeStart = Math.max(0, highlight.startIndex - 24);
      const safeEnd = Math.min(
        passageSourceText.length,
        highlight.endIndex + 24,
      );
      const before = passageSourceText.slice(safeStart, highlight.startIndex);
      const text =
        highlight.highlightText ||
        passageSourceText.slice(highlight.startIndex, highlight.endIndex);
      const after = passageSourceText.slice(highlight.endIndex, safeEnd);
      return {
        before: before.replace(/\s+/g, " "),
        text: text.replace(/\s+/g, " "),
        after: after.replace(/\s+/g, " "),
      };
    },
    [passageSourceText],
  );

  const jumpToHighlight = useCallback((highlightId: string) => {
    setLeftTab("passage");
    setActiveHighlightId(highlightId);
    requestAnimationFrame(() => {
      const target = markRefs.current.get(highlightId);
      if (target) {
        target.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    });
  }, []);

  /**
   * Render passage HTML while wrapping only text nodes with <mark> for highlights.
   * Preserve DOM structure (images, links, block tags) and avoid spacing shifts.
   */
  const renderHighlightedText = useCallback((): React.ReactNode => {
    const html = passageText;
    if (!html) return null;
    if (typeof window === "undefined" || typeof DOMParser === "undefined") {
      return <RichContent html={html} />;
    }

    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");
    const body = doc.body;

    let globalOffset = 0;

    const renderNode = (node: ChildNode): React.ReactNode => {
      if (node.nodeType === Node.TEXT_NODE) {
        const text = node.textContent || "";
        const parts: React.ReactNode[] = [];
        const start = globalOffset;
        const end = start + text.length;
        let cursor = start;

        sortedHighlights.forEach((h) => {
          const hStart = Math.max(h.startIndex, start);
          const hEnd = Math.min(h.endIndex, end);
          if (hStart >= hEnd) return;
          if (hStart > cursor) {
            parts.push(text.slice(cursor - start, hStart - start));
          }
          const bg =
            h.color === "yellow"
              ? "bg-yellow-200 dark:bg-yellow-900/50"
              : "bg-green-200 dark:bg-green-900/50";
          parts.push(
            <mark
              key={`${h.id}-${hStart}`}
              ref={(el) => {
                if (el) markRefs.current.set(h.id, el);
              }}
              className={`${bg} inline rounded px-0 py-0 cursor-pointer hover:opacity-90 transition-opacity ${
                activeHighlightId === h.id ? "ring-2 ring-primary/50" : ""
              }`}
              onClick={() =>
                setActiveHighlightId((prev) => (prev === h.id ? null : h.id))
              }
              title="Click để chọn highlight"
            >
              {text.slice(hStart - start, hEnd - start)}
            </mark>,
          );
          cursor = hEnd;
        });

        if (cursor < end) {
          parts.push(text.slice(cursor - start));
        }
        globalOffset = end;
        if (parts.length === 1 && typeof parts[0] === "string") {
          return parts[0];
        }
        return <>{parts}</>;
      }

      if (node.nodeType === Node.ELEMENT_NODE) {
        const el = node as HTMLElement;
        const children = Array.from(el.childNodes).map((child, idx) => (
          <React.Fragment key={idx}>{renderNode(child)}</React.Fragment>
        ));
        const props: Record<string, any> = {};
        Array.from(el.attributes).forEach((attr) => {
          props[attr.name] = attr.value;
        });

        const tag = el.tagName.toLowerCase();
        return React.createElement(tag, props, children);
      }

      // Ignore comments/others
      return null;
    };

    const rendered = Array.from(body.childNodes).map((child, idx) => (
      <React.Fragment key={idx}>{renderNode(child)}</React.Fragment>
    ));

    return <>{rendered}</>;
  }, [
    passageText,
    sortedHighlights,
    activeHighlightId,
    setActiveHighlightId,
    markRefs,
  ]);

  // Flatten all questions from all groups
  const allQuestions =
    questionGroups?.flatMap((group: any, gIdx: number) =>
      (group.questions || []).map((q: any) => ({
        ...q,
        groupTitle: group.title,
        groupInstructions: group.instructions,
      })),
    ) || [];

  return (
    <div className="h-full grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x relative">
      {showHighlightMenu && pendingHighlight && (
        <div
          className="fixed z-50 bg-card border rounded-lg shadow-lg p-3 w-[280px] space-y-2"
          style={{
            left: menuPosition.x,
            top: menuPosition.y,
            transform: "translate(-50%, -100%)",
          }}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
              <Pencil className="h-3.5 w-3.5" />
              Chọn màu highlight
            </span>
            <div className="flex items-center gap-1">
              <Button
                size="sm"
                variant="ghost"
                className={cn(
                  "h-7 w-7 p-0",
                  newHighlightColor === "yellow"
                    ? "bg-yellow-200"
                    : "bg-yellow-100/60",
                )}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => setNewHighlightColor("yellow")}
              >
                <Highlighter className="h-3.5 w-3.5" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className={cn(
                  "h-7 w-7 p-0",
                  newHighlightColor === "green"
                    ? "bg-green-200"
                    : "bg-green-100/60",
                )}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => setNewHighlightColor("green")}
              >
                <Highlighter className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
          <p className="text-xs rounded-md border bg-muted/30 px-2 py-1.5">
            {normalizeText(pendingHighlight.text)}
          </p>
          <div className="flex justify-end gap-2">
            <Button
              size="sm"
              variant="ghost"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                setPendingHighlight(null);
                setShowHighlightMenu(false);
                window.getSelection()?.removeAllRanges();
              }}
            >
              Hủy
            </Button>
            <Button
              size="sm"
              onMouseDown={(e) => e.preventDefault()}
              onClick={handleSaveHighlight}
            >
              Lưu
            </Button>
          </div>
        </div>
      )}

      {/* Left - Passage */}
      <ScrollArea className="h-[calc(100vh-200px)]">
        <div ref={passageRef} className="p-6" onMouseUp={handleTextSelection}>
          <div className="flex items-center justify-between gap-2 mb-4">
            <div className="flex items-center gap-2 text-[hsl(var(--reading))]">
              <BookOpen className="h-5 w-5" />
              <h2 className="text-xl font-semibold">{section.title}</h2>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Highlighter className="h-3 w-3" />
                <span>Bôi đen rồi bấm pencil để chọn màu, sau đó lưu</span>
              </div>
              {sortedHighlights.length > 0 && (
                <div className="inline-flex items-center rounded-md border bg-background p-0.5">
                  <Button
                    size="sm"
                    variant={leftTab === "passage" ? "secondary" : "ghost"}
                    className="h-7 px-2 text-xs"
                    onClick={() => setLeftTab("passage")}
                  >
                    Passage
                  </Button>
                  <Button
                    size="sm"
                    variant={leftTab === "highlights" ? "secondary" : "ghost"}
                    className="h-7 px-2 text-xs"
                    onClick={() => setLeftTab("highlights")}
                  >
                    <List className="h-3.5 w-3.5 mr-1" />
                    Highlights ({sortedHighlights.length})
                  </Button>
                </div>
              )}
            </div>
          </div>

          {leftTab === "passage" && passageText && (
            <div
              ref={passageContentRef}
              className="rich-content rich-content-passage w-full leading-relaxed text-foreground select-text"
            >
              {highlights.length === 0 ? (
                <RichContent html={passageText} variant="passage" />
              ) : (
                renderHighlightedText()
              )}
            </div>
          )}

          {leftTab === "highlights" && sortedHighlights.length > 0 && (
            <div className="space-y-3">
              {sortedHighlights.map((highlight, index) => {
                const preview = getHighlightPreview(highlight);
                const itemActive = activeHighlightId === highlight.id;
                return (
                  <button
                    key={highlight.id}
                    type="button"
                    className={cn(
                      "w-full text-left rounded-lg border p-3 transition-all bg-card hover:shadow-sm",
                      itemActive
                        ? "border-primary ring-1 ring-primary/30"
                        : "border-border",
                    )}
                    onClick={() => jumpToHighlight(highlight.id)}
                  >
                    <div className="flex items-center justify-between mb-1.5 gap-2">
                      <span className="text-xs font-semibold text-muted-foreground">
                        Highlight #{index + 1}
                      </span>
                      <div className="flex items-center gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 w-6 p-0 bg-yellow-200 hover:bg-yellow-300"
                          onClick={(e) => {
                            e.stopPropagation();
                            updateHighlightColor(highlight.id, "yellow");
                          }}
                          title="Đổi sang vàng"
                        >
                          <Highlighter className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 w-6 p-0 bg-green-200 hover:bg-green-300"
                          onClick={(e) => {
                            e.stopPropagation();
                            updateHighlightColor(highlight.id, "green");
                          }}
                          title="Đổi sang xanh"
                        >
                          <Highlighter className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 w-6 p-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeHighlight(highlight.id);
                            if (activeHighlightId === highlight.id) {
                              setActiveHighlightId(null);
                            }
                          }}
                          title="Xóa highlight"
                        >
                          <Trash2 className="h-3 w-3 text-destructive" />
                        </Button>
                      </div>
                    </div>
                    <p className="text-sm leading-relaxed">
                      <span className="text-muted-foreground">{preview.before}</span>
                      <span
                        className={cn(
                          "font-semibold px-1 rounded-sm",
                          highlight.color === "yellow"
                            ? "bg-yellow-100"
                            : "bg-green-100",
                        )}
                      >
                        {preview.text || "(trống)"}
                      </span>
                      <span className="text-muted-foreground">{preview.after}</span>
                    </p>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Right - Questions */}
      <ScrollArea className="h-[calc(100vh-200px)]">
        <div className="p-6 space-y-6">
          {section.instructions && (
            <Card className="bg-white border-orange-500 border shadow-sm">
              <CardContent className="p-4 text-sm text-black font-medium">
                <RichContent html={section.instructions} />
              </CardContent>
            </Card>
          )}

          {questionGroups?.map((group: any, gIdx: number) => (
            <div key={group.id} className="space-y-4">
              {group.title && (
                <h3 className="font-semibold text-lg text-foreground">
                  {group.title}
                </h3>
              )}
              {group.instructions && (
                <div className="p-3 bg-white border-orange-500/50 border rounded-lg text-sm text-black font-semibold shadow-sm mb-4">
                  <RichContent html={group.instructions} />
                </div>
              )}

              {(group.audioUrl || group.audio_url) && (
                <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 mb-2 flex items-center gap-3">
                  <audio
                    src={group.audioUrl || group.audio_url}
                    controls
                    className="h-10 w-full"
                  />
                </div>
              )}


              {(group.questions || []).map((question: any, qIndex: number) => {
                const isCurrent =
                  question.id === currentQuestionId ||
                  currentQuestionId?.startsWith(`${question.id}::blank:`);
                const focusQuestionId =
                  isFillBlankLike ? `${question.id}::blank:0` : question.id;
                const questionText = question.question_text || "";
                const groupPassageText = group.passage || passageText || "";
                const isDuplicatePassageQuestion = isLikelyDuplicateWithPassage(
                  questionText,
                  groupPassageText,
                );
                const hasPlaceholders = hasFillBlankPlaceholders(
                  questionText,
                );
                const isFillBlankLike =
                  question.question_type === "fill_blank" || hasPlaceholders;
                const compactBlankKeys = isFillBlankLike
                  ? getBlankKeysFromQuestionText(questionText)
                  : [];

                if (import.meta.env.DEV && hasPlaceholders && question.id) {
                  console.debug("[ReadingSection][fill_blank debug]", {
                    id: question.id,
                    question_type: question.question_type,
                    question_text: questionText,
                    isDuplicatePassageQuestion,
                  });
                }

                return (
                  <Card
                    key={question.id}
                    ref={(el) => {
                      if (el && questionRefs) {
                        questionRefs.current.set(question.id, el);
                      }
                    }}
                    className={cn(
                      "transition-all duration-300 border-l-4",
                      isCurrent
                        ? "ring-1 ring-primary shadow-md border-l-primary bg-primary/5"
                        : "border-l-transparent hover:border-l-muted-foreground/30 hover:shadow-sm",
                    )}
                    onClick={() => onQuestionFocus?.(focusQuestionId)}
                  >
                    <CardContent className="p-5">
                      <div className="flex items-start gap-4 mb-4">
                        <span className="shrink-0 inline-flex items-center justify-center w-8 h-8 rounded-full bg-[hsl(var(--reading))] text-white text-sm font-bold shadow-sm">
                          {question.order_index || qIndex + 1}
                        </span>
                        <div className="flex-1 space-y-3">
                          {/* Only show question text here if it's NOT a fill_blank-like question */}
                          {!isFillBlankLike && !isDuplicatePassageQuestion && (
                            <RichContent
                              html={questionText}
                              className="font-semibold text-base"
                            />
                          )}
                          {!isFillBlankLike && isDuplicatePassageQuestion && (
                            <p className="text-xs font-medium text-muted-foreground italic">
                              Câu hỏi tham chiếu nội dung passage bên trái.
                            </p>
                          )}

                          {question.question_audio_url && (
                            <div className="bg-muted/50 p-3 rounded-xl border border-border/50 flex items-center gap-3">
                              <audio
                                src={question.question_audio_url}
                                controls
                                className="h-8 w-full max-w-[250px]"
                              />
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="ml-12 space-y-4">
                        {question.question_type === "multiple_choice" &&
                          question.options &&
                          question.options.length > 0 &&
                          (() => {
                            const selectedRaw = answers[question.id];
                            const selectedValues = Array.isArray(selectedRaw)
                              ? selectedRaw
                              : selectedRaw
                                ? [selectedRaw]
                                : [];
                            const hasMultipleCorrect =
                              typeof question.correct_answer === "string" &&
                              question.correct_answer
                                .split("|")
                                .map((v: string) => v.trim())
                                .filter(Boolean).length > 1;

                            const currentAnswers = typeof question.correct_answer === "string"
                              ? question.correct_answer.split("|").map((v: string) => v.trim()).filter(Boolean)
                              : [];
                            if (hasMultipleCorrect) {
                              const expectedCount = currentAnswers.length;
                              return (
                                <div className="space-y-2">
                                  <div className="flex items-center gap-2 text-xs font-semibold text-[hsl(var(--reading))] bg-[hsl(var(--reading))]/8 border border-[hsl(var(--reading))]/20 rounded-lg px-3 py-1.5">
                                    <CheckSquare className="h-3.5 w-3.5 flex-shrink-0" />
                                    <span>Chọn {expectedCount} đáp án phù hợp</span>
                                    <span className="ml-auto text-muted-foreground font-normal">
                                      Đã chọn: {selectedValues.length}/{expectedCount}
                                    </span>
                                  </div>
                                  <div className="grid gap-2">
                                    {question.options.map(
                                      (option: string, i: number) => {
                                        const checked =
                                          selectedValues.includes(option);
                                        return (
                                          <label
                                            key={i}
                                            className={cn(
                                              "flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer",
                                              checked
                                                ? "bg-[hsl(var(--reading))]/5 border-[hsl(var(--reading))]/30 ring-1 ring-[hsl(var(--reading))]/20"
                                                : "bg-background border-transparent hover:bg-muted/30",
                                            )}
                                          >
                                            <Checkbox
                                              checked={checked}
                                              onCheckedChange={(next) => {
                                                const nextValues = new Set(
                                                  selectedValues,
                                                );
                                                if (next) nextValues.add(option);
                                                else nextValues.delete(option);
                                                onAnswerChange(
                                                  question.id,
                                                  Array.from(nextValues),
                                                );
                                              }}
                                            />
                                            <span className="font-medium text-sm">
                                              {option}
                                            </span>
                                          </label>
                                        );
                                      },
                                    )}
                                  </div>
                                </div>
                              );
                            }

                            return (
                              <RadioGroup
                                value={selectedValues[0] || ""}
                                onValueChange={(value) =>
                                  onAnswerChange(question.id, value)
                                }
                                className="grid gap-2"
                              >
                                {question.options.map(
                                  (option: string, i: number) => (
                                  <div
                                    key={i}
                                    className={cn(
                                      "flex items-center space-x-3 p-3 rounded-xl border transition-all cursor-pointer",
                                      answers[question.id] === option
                                        ? "bg-[hsl(var(--reading))]/5 border-[hsl(var(--reading))]/30 ring-1 ring-[hsl(var(--reading))]/20"
                                        : "bg-background border-transparent hover:bg-muted/30",
                                    )}
                                  >
                                    <RadioGroupItem
                                      value={option}
                                      id={`${question.id}-${i}`}
                                    />
                                    <Label
                                      htmlFor={`${question.id}-${i}`}
                                      className="flex-1 cursor-pointer font-medium text-sm"
                                    >
                                      {option}
                                    </Label>
                                  </div>
                                ),
                              )}
                              </RadioGroup>
                            );
                          })()}

                        {(isFillBlankLike ||
                          question.question_type === "short_answer") && (
                            <div className="space-y-2">
                              {isFillBlankLike ? (
                                isDuplicatePassageQuestion ? (
                                  <div className="space-y-3 rounded-lg border bg-muted/20 p-3">
                                    <p className="text-xs text-muted-foreground font-medium">
                                      Nội dung passage đã hiển thị bên trái.
                                      Nhập đáp án theo thứ tự các ô trống:
                                    </p>
                                    <div className="grid gap-2 sm:grid-cols-2">
                                      {compactBlankKeys.map((blankKey, idx) => (
                                        <div
                                          key={`${question.id}-${blankKey}`}
                                          className="space-y-1"
                                        >
                                          <Label className="text-xs text-muted-foreground">
                                            Blank {idx + 1}
                                          </Label>
                                          <Input
                                            placeholder={`Đáp án #${idx + 1}`}
                                            value={
                                              (answers[question.id] || {})[
                                                blankKey
                                              ] || ""
                                            }
                                            onChange={(e) =>
                                              onAnswerChange(question.id, {
                                                ...(answers[question.id] || {}),
                                                [blankKey]: e.target.value,
                                              })
                                            }
                                            className="h-10"
                                          />
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                ) : (
                                  <FillBlankHtmlRenderer
                                    html={questionText}
                                    answers={answers[question.id] || {}}
                                    questionId={question.id}
                                    onAnswerChange={onAnswerChange as any}
                                    questionRefs={questionRefs}
                                    currentQuestionId={currentQuestionId}
                                  />
                                )
                              ) : (
                                /* Standard rendering for short_answer or fill_blank without placeholders */
                                <div className="space-y-2">
                                  <Input
                                    placeholder="Nhập câu trả lời..."
                                    value={answers[question.id] || ""}
                                    onChange={(e) =>
                                      onAnswerChange(question.id, e.target.value)
                                    }
                                    className="max-w-md h-11"
                                  />
                                  <p className="text-[11px] text-muted-foreground font-medium italic">
                                    Gợi ý: ONE WORD ONLY
                                  </p>
                                </div>
                              )}
                            </div>
                          )}

                        {question.question_type === "true_false_not_given" && (
                          <div className="max-w-[200px]">
                            <DropdownSelect
                              value={answers[question.id] || ""}
                              onChange={(value) =>
                                onAnswerChange(question.id, value)
                              }
                              options={["TRUE", "FALSE", "NOT GIVEN"]}
                              placeholder="Chọn đáp án"
                            />
                          </div>
                        )}

                        {question.question_type === "yes_no_not_given" && (
                          <div className="max-w-[200px]">
                            <DropdownSelect
                              value={answers[question.id] || ""}
                              onChange={(value) =>
                                onAnswerChange(question.id, value)
                              }
                              options={["YES", "NO", "NOT GIVEN"]}
                              placeholder="Chọn đáp án"
                            />
                          </div>
                        )}

                        {question.question_type === "matching" && (
                          <MatchingRenderer
                            question={question}
                            answers={answers}
                            onAnswerChange={onAnswerChange}
                          />
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
