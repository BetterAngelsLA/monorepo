import { TQuestion, TResult } from '../questionnaire.types';
import { getQuestionsByIds } from './getQuestionsByIds';

type TProps = {
  questions: TQuestion[];
  currentQuestion: TQuestion;
  currentResult?: TResult;
};

export function getNextQuestion(props: TProps): TQuestion[] {
  const { questions, currentQuestion, currentResult } = props;

  const next = currentQuestion.next;

  if (Array.isArray(next)) {
    return getQuestionsByIds(questions, next);
  }

  try {
    console.log();
    console.log('| -------------  currentResult  ------------- |');
    console.log(currentResult);
    console.log();

    if (!currentResult) {
      return [];
    }

    // TODO: adjust model and types
    const nextQuestionIds = next[currentResult.value as string];

    // TODO: nextConfig can be an object
    return getQuestionsByIds(questions, nextQuestionIds as string[]);
  } catch (e) {
    console.error(
      `[getNextQuestion] cannot get next question for current Question id [${currentQuestion.id}] and currentResult [${currentResult}]`
    );

    return [];
  }
}
