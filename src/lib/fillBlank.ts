export const parseFillBlankCorrectAnswers = (
  correctAnswer: string | null | undefined,
): string[] => {
  if (!correctAnswer) return [];

  try {
    const parsed = JSON.parse(correctAnswer);

    if (Array.isArray(parsed)) {
      return parsed.map((item) => String(item ?? "").trim());
    }

    if (parsed && typeof parsed === "object") {
      return Object.keys(parsed)
        .sort((a, b) => Number(a) - Number(b))
        .map((key) => String(parsed[key] ?? "").trim());
    }
  } catch {
    // Fallback to pipe-delimited legacy format
  }

  return correctAnswer
    .split("|")
    .map((item) => item.trim())
    .filter(Boolean);
};

export const getFillBlankBlankCount = (
  correctAnswer: string | null | undefined,
): number => parseFillBlankCorrectAnswers(correctAnswer).length;

