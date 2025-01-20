import { TQuestion } from '../questionnaire.types';
import { getQuestionById } from './getQuestionById';

export function getQuestionsByIds(questions: TQuestion[], ids: string[]) {
  const result: TQuestion[] = [];

  ids.forEach((id) => {
    const question = getQuestionById(questions, id);

    // if (!question) { throw ???? };

    if (question) {
      result.push(question);
    }
  });

  return result;
}
