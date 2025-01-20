import { TQuestion } from '../questionnaire.types';

export function getQuestionById(questions: TQuestion[], id: string) {
  return questions.find((q) => q.id === id);
}
