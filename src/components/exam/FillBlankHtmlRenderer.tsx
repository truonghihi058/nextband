import React, {
  useRef,
  useEffect,
  useCallback,
  useMemo,
  MutableRefObject,
} from "react";

const FILL_BLANK_PLACEHOLDER_REGEX = /(\[BLANK(?:_\d+)?\])/g;

interface FillBlankHtmlRendererProps {
  html: string;
  answers: Record<string, any>;
  questionId: string;
  onAnswerChange: (questionId: string, answer: any) => void;
  questionRefs?: MutableRefObject<Map<string, HTMLElement>>;
  currentQuestionId?: string;
}

export function FillBlankHtmlRenderer({
  html,
  answers,
  questionId,
  onAnswerChange,
  questionRefs,
  currentQuestionId,
}: FillBlankHtmlRendererProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Keep values in refs for the event listener to avoid stale closures
  const answersRef = useRef(answers);
  const questionIdRef = useRef(questionId);
  const onAnswerChangeRef = useRef(onAnswerChange);

  useEffect(() => {
    answersRef.current = answers;
    questionIdRef.current = questionId;
    onAnswerChangeRef.current = onAnswerChange;
  }, [answers, questionId, onAnswerChange]);

  // Memoize processed HTML to avoid unnecessary re-renders
  const processedHtml = useMemo(() => {
    return html.replace(FILL_BLANK_PLACEHOLDER_REGEX, (match) => {
      const indexMatch = match.match(/^\[BLANK_(\d+)\]$/);
      const blankIndex = indexMatch ? Number(indexMatch[1]) - 1 : -1;
      return `<span data-fill-blank="${blankIndex}" class="fill-blank-slot"></span>`;
    });
  }, [html]);

  const assignIndices = useCallback(() => {
    if (!containerRef.current) return;
    const slots = containerRef.current.querySelectorAll(".fill-blank-slot");
    let cursor = 0;
    slots.forEach((slot) => {
      const idx = slot.getAttribute("data-fill-blank");
      if (idx === "-1" || idx === null) {
        slot.setAttribute("data-fill-blank", String(cursor));
      } else {
        cursor = Number(idx);
      }
      cursor++;
    });
  }, []);

  // Main Effect: DOM Manipulation and Event Listeners
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // 1. Assign indices to slots
    assignIndices();

    const registeredFocusIds: string[] = [];

    // 2. Clear out any existing inputs that might be lingering from previous renders
    // although dangerouslySetInnerHTML usually handles this, we ensure a clean state
    const slots = container.querySelectorAll(".fill-blank-slot");
    slots.forEach((slot) => {
      const blankKey = slot.getAttribute("data-fill-blank") || "0";
      const focusId = `${questionIdRef.current}::blank:${blankKey}`;
      let input = slot.querySelector("input") as HTMLInputElement | null;

      if (!input) {
        input = document.createElement("input");
        input.type = "text";
        input.placeholder = "...";
        input.className =
          "inline-block w-28 h-8 border-b-2 border-t-0 border-l-0 border-r-0 border-primary/40 bg-transparent text-center text-sm font-medium focus:outline-none focus:border-primary px-1 mx-1 transition-colors";
        slot.appendChild(input);
      }

      // Crucial: Set a unique identifier for this input instance to prevent cross-contamination
      input.setAttribute("data-blank-key", blankKey);
      input.setAttribute("data-owner-id", questionIdRef.current);
      input.setAttribute("data-focus-id", focusId);

      if (questionRefs?.current) {
        questionRefs.current.set(focusId, slot as HTMLElement);
        registeredFocusIds.push(focusId);
      }

      const currentAnswers = answersRef.current || {};
      const currentValue = currentAnswers[blankKey] || "";
      if (input.value !== currentValue) {
        input.value = currentValue;
      }
    });

    // 3. Event Delegation with strict ID checking
    const handleInput = (e: Event) => {
      const target = e.target as HTMLInputElement;
      if (target.tagName === "INPUT") {
        const ownerId = target.getAttribute("data-owner-id");
        const key = target.getAttribute("data-blank-key");

        // Safety check: Only handle events for inputs owned by THIS component instance
        if (ownerId === questionIdRef.current && key !== null) {
          onAnswerChangeRef.current(ownerId, {
            ...answersRef.current,
            [key]: target.value,
          });
        }
      }
    };

    container.addEventListener("input", handleInput);
    return () => {
      container.removeEventListener("input", handleInput);
      if (questionRefs?.current && registeredFocusIds.length > 0) {
        registeredFocusIds.forEach((focusId) => {
          questionRefs.current.delete(focusId);
        });
      }
    };
  }, [processedHtml, assignIndices, questionRefs]); // Re-run if HTML changes

  // 4. Sync Side Effect: Watch answers prop for external changes (like Resets or Multi-input sync)
  useEffect(() => {
    if (!containerRef.current) return;
    const inputs = containerRef.current.querySelectorAll(
      `.fill-blank-slot input[data-owner-id="${questionId}"]`,
    ) as NodeListOf<HTMLInputElement>;

    inputs.forEach((input) => {
      const key = input.getAttribute("data-blank-key") || "0";
      const currentValue = answers[key] || "";
      if (input.value !== currentValue) {
        input.value = currentValue;
      }
    });
  }, [answers, questionId]);

  useEffect(() => {
    if (!currentQuestionId || !questionRefs?.current) return;
    if (!currentQuestionId.startsWith(`${questionId}::blank:`)) return;
    const target = questionRefs.current.get(currentQuestionId);
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "center" });
      const input = target.querySelector("input") as HTMLInputElement | null;
      input?.focus();
    }
  }, [currentQuestionId, questionId, questionRefs]);

  return React.createElement("div", {
    ref: containerRef,
    className:
      "prose prose-sm max-w-none [&_table]:border-collapse [&_table]:w-full [&_td]:border [&_td]:border-border [&_td]:p-2 [&_th]:border [&_th]:border-border [&_th]:p-2 [&_th]:bg-muted/50 [&_th]:font-semibold",
    dangerouslySetInnerHTML: { __html: processedHtml },
  });
}

export { FILL_BLANK_PLACEHOLDER_REGEX };

export const hasFillBlankPlaceholders = (text: string) => {
  if (!text) return false;
  const plain = text.replace(/<[^>]*>/g, "");
  return /(\[BLANK(?:_\d+)?\])/.test(plain);
};
