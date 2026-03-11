import React, { useMemo } from "react";
import { cn } from "@/lib/utils";
import { FILL_BLANK_PLACEHOLDER_REGEX } from "./FillBlankHtmlRenderer";
import { parseFillBlankAnswers } from "../admin/question-forms/QuestionFormTypes";

interface FillBlankResultRendererProps {
  html: string;
  studentAnswers: Record<string, string>;
  correctAnswersValue: string | null;
}

export function FillBlankResultRenderer({
  html,
  studentAnswers,
  correctAnswersValue,
}: FillBlankResultRendererProps) {
  const correctAnswers = useMemo(() => {
    return parseFillBlankAnswers(correctAnswersValue);
  }, [correctAnswersValue]);

  const processedHtml = useMemo(() => {
    let blankCounter = 0;
    return html.replace(FILL_BLANK_PLACEHOLDER_REGEX, (match) => {
      const indexMatch = match.match(/^\[BLANK_(\d+)\]$/);
      const blankIndex = indexMatch ? Number(indexMatch[1]) - 1 : blankCounter;

      const studentAnswer = (studentAnswers[String(blankIndex)] || "").trim();
      const correctAnswerSlot = correctAnswers[blankIndex] || "";

      // Split allowed answers by |
      const allowedAnswers = correctAnswerSlot
        .split("|")
        .map((a) => a.trim().toLowerCase())
        .filter(Boolean);

      const isCorrect = allowedAnswers.includes(studentAnswer.toLowerCase());
      const hasAnswer = studentAnswer !== "";

      const displayAnswer = hasAnswer ? studentAnswer : "(Trống)";

      const statusClass = isCorrect
        ? "text-green-600 font-bold border-b-2 border-green-600/30 px-1"
        : hasAnswer
          ? "text-destructive font-bold border-b-2 border-destructive/30 px-1"
          : "text-muted-foreground italic border-b-2 border-muted/30 px-1";

      const tooltipContent =
        !isCorrect && correctAnswerSlot
          ? ` title="Đáp án đúng: ${correctAnswerSlot}" `
          : "";

      blankCounter++;
      return `<span class="${statusClass}"${tooltipContent}>${displayAnswer}</span>`;
    });
  }, [html, studentAnswers, correctAnswers]);

  return (
    <div
      className="prose prose-sm max-w-none [&_table]:border-collapse [&_table]:w-full [&_td]:border [&_td]:border-border [&_td]:p-2 [&_th]:border [&_th]:border-border [&_th]:p-2 [&_th]:bg-muted/50 [&_th]:font-semibold"
      dangerouslySetInnerHTML={{ __html: processedHtml }}
    />
  );
}
