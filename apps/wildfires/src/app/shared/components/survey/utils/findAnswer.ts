import { TAnswer } from '../types';

type TFindAnswerByQuestionId = {
  questionId: string;
  answers: TAnswer[];
};

export function findAnswerByQuestionId(
  props: TFindAnswerByQuestionId
): TAnswer | undefined {
  const { questionId, answers } = props;

  return answers.find((a) => a.questionId === questionId);
}
