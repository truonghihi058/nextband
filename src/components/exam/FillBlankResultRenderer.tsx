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
  const escapeHtml = (value: string) =>
    value
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");

  const correctAnswers = useMemo(() => {
    return parseFillBlankAnswers(correctAnswersValue);
  }, [correctAnswersValue]);

  const processedHtml = useMemo(() => {
    let autoCursor = 0;
    return html.replace(FILL_BLANK_PLACEHOLDER_REGEX, (match) => {
      const indexMatch = match.match(/^\[BLANK_(\d+)\]$/);
      const explicitIndex = indexMatch ? Number(indexMatch[1]) - 1 : null;
      const blankIndex =
        explicitIndex !== null && explicitIndex >= 0
          ? explicitIndex
          : autoCursor;

      const studentAnswer = (studentAnswers[String(blankIndex)] || "").trim();
      const correctAnswerSlot = correctAnswers[blankIndex] || "";

      // Split allowed answers by |
      const allowedAnswers = correctAnswerSlot
        .split("|")
        .map((a) => a.trim().toLowerCase())
        .filter(Boolean);

      const isCorrect = allowedAnswers.includes(studentAnswer.toLowerCase());
      const hasAnswer = studentAnswer !== "";

      const displayAnswer = hasAnswer ? escapeHtml(studentAnswer) : "(Trống)";
      const displayCorrect = escapeHtml(correctAnswerSlot);

      const statusClass = isCorrect
        ? "text-green-600 font-bold border-b-2 border-green-600/30 px-1 inline-flex items-center gap-1 mx-1"
        : "border-b-2 border-destructive/30 px-1 inline-flex items-center gap-1 mx-1";

      const answerClass = isCorrect
        ? ""
        : hasAnswer
          ? "text-destructive font-bold line-through opacity-80"
          : "text-muted-foreground italic";

      let displayContent = `<span class="${answerClass}">${displayAnswer}</span>`;

      if (!isCorrect && correctAnswerSlot) {
        displayContent += `<span class="text-green-700 bg-green-100 dark:bg-green-900/40 border border-green-200 dark:border-green-800 text-[11px] px-1.5 py-0.5 rounded font-bold whitespace-nowrap leading-none tracking-wide uppercase">Đúng: ${displayCorrect}</span>`;
      }

      autoCursor =
        explicitIndex !== null && explicitIndex >= 0
          ? explicitIndex + 1
          : autoCursor + 1;
      return `<span class="${statusClass}">${displayContent}</span>`;
    });
  }, [html, studentAnswers, correctAnswers]);

  return (
    <div
      className="prose prose-sm max-w-none [&_table]:border-collapse [&_table]:w-full [&_td]:border [&_td]:border-border [&_td]:p-2 [&_th]:border [&_th]:border-border [&_th]:p-2 [&_th]:bg-muted/50 [&_th]:font-semibold"
      dangerouslySetInnerHTML={{ __html: processedHtml }}
    />
  );
}
