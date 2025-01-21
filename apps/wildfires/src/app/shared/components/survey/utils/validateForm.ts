import { TAnswer, TQuestion } from '../types';
import { findAnswerByQuestionId } from './findAnswer';

type TProps = {
  questions: TQuestion[];
  answers: TAnswer[];
};

export function validateForm(props: TProps): string[] {
  const { questions, answers } = props;

  const errors: string[] = [];

  for (const question of questions) {
    const rules = question.rules;

    if (!rules) {
      continue;
    }

    const questionId = question.id;

    const answer = findAnswerByQuestionId({
      answers,
      questionId,
    });

    if (rules.required) {
      const result = answer?.result;

      if (!result) {
        errors.push(`answer required for question ${questionId}`);
      }

      if (question.type === 'checkbox') {
        const emptyArr = Array.isArray(result) && !result.length;

        if (emptyArr) {
          errors.push(`answer required for question ${questionId}`);
        }
      }
    }
  }

  return errors;
}
