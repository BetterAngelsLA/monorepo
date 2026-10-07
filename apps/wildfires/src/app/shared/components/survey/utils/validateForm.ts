import { TAnswer, TQuestion } from '../types';

type Props = { questions: TQuestion[]; answers: TAnswer[] };

export function validateForm({ questions, answers }: Props): string[] {
  const errors: string[] = [];
  for (const question of questions) {
    const result = answers.find(
      (answer) => answer.questionId === question.id,
    )?.result;
    if (result === undefined) {
      if (question.rules?.required)
        errors.push(`answer required for question ${question.id}`);
      continue;
    }

    const validShape =
      question.type === 'radio'
        ? typeof result === 'string'
        : Array.isArray(result);
    if (!validShape) {
      errors.push(`invalid answer type for question ${question.id}`);
      continue;
    }

    if (result.length === 0) {
      if (question.rules?.required)
        errors.push(`answer required for question ${question.id}`);
      continue;
    }

    const values = Array.isArray(result) ? result : [result];
    if (
      values.some(
        (value) =>
          !question.options.some((option) => option.optionId === value),
      )
    ) {
      errors.push(`invalid option for question ${question.id}`);
    }
  }
  return errors;
}
