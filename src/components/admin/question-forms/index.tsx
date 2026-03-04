export type { QuestionFormData, QuestionFormProps } from "./QuestionFormTypes";
export {
  FILL_BLANK_PLACEHOLDER_REGEX,
  extractFillBlankTokens,
  parseFillBlankAnswers,
  stringifyFillBlankAnswers,
} from "./QuestionFormTypes";

export { FillBlankForm } from "./FillBlankForm";
export { SpeakingForm } from "./SpeakingForm";
export { ListeningForm } from "./ListeningForm";
export { MultipleChoiceForm } from "./MultipleChoiceForm";
export { TrueFalseForm } from "./TrueFalseForm";
export { ShortAnswerForm } from "./ShortAnswerForm";
export { MatchingForm } from "./MatchingForm";
export { EssayForm } from "./EssayForm";

import type { QuestionFormProps } from "./QuestionFormTypes";
import { FillBlankForm } from "./FillBlankForm";
import { SpeakingForm } from "./SpeakingForm";
import { ListeningForm } from "./ListeningForm";
import { MultipleChoiceForm } from "./MultipleChoiceForm";
import { TrueFalseForm } from "./TrueFalseForm";
import { ShortAnswerForm } from "./ShortAnswerForm";
import { MatchingForm } from "./MatchingForm";
import { EssayForm } from "./EssayForm";

interface QuestionFormRendererProps extends QuestionFormProps {
  questionType: string;
}

export function QuestionFormRenderer({
  questionType,
  form,
  onChange,
}: QuestionFormRendererProps) {
  switch (questionType) {
    case "multiple_choice":
      return <MultipleChoiceForm form={form} onChange={onChange} />;
    case "true_false_not_given":
    case "yes_no_not_given":
      return <TrueFalseForm form={form} onChange={onChange} />;
    case "short_answer":
      return <ShortAnswerForm form={form} onChange={onChange} />;
    case "fill_blank":
      return <FillBlankForm form={form} onChange={onChange} />;
    case "matching":
      return <MatchingForm form={form} onChange={onChange} />;
    case "essay":
      return <EssayForm form={form} onChange={onChange} />;
    case "speaking":
      return <SpeakingForm form={form} onChange={onChange} />;
    case "listening":
      return <ListeningForm form={form} onChange={onChange} />;
    default:
      return null;
  }
}
