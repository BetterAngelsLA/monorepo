import { TQuestion } from '../types';

export function findQuestionById(questions: TQuestion[], id: string) {
  return questions.find((q) => q.id === id);
}
