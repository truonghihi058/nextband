// Shared types and utils for question forms

export interface QuestionFormData {
  questionText: string;
  questionType: string;
  options: string[];
  correctAnswer: string;
  fillBlankAnswers: string[];
  points: number;
  audioUrl: string;
}

export interface QuestionFormProps {
  form: QuestionFormData;
  onChange: (updates: Partial<QuestionFormData>) => void;
}

// Fill-blank utils
export const FILL_BLANK_PLACEHOLDER_REGEX = /(\[BLANK(?:_\d+)?\])/g;

export const extractFillBlankTokens = (text: string): string[] => {
  if (!text) return [];
  // Strip HTML tags so we match placeholders in the text content
  const plain = text.replace(/<[^>]*>/g, "");
  return plain.match(FILL_BLANK_PLACEHOLDER_REGEX) || [];
};

export const parseFillBlankAnswers = (
  value: string | null | undefined,
): string[] => {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) {
      return parsed.map((item) => String(item ?? "").trim());
    }
  } catch {}

  return value
    .split("|")
    .map((item) => item.trim())
    .filter(Boolean);
};

export const stringifyFillBlankAnswers = (answers: string[]): string =>
  JSON.stringify(answers.map((item) => item.trim()));
