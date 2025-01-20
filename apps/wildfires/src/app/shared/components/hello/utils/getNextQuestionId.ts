import { TNextQTarget } from '../types';

type TProps = {
  next: TNextQTarget | undefined;
  answerOptionId: string;
};

export function getNextQuestionId(props: TProps): string | null {
  const { next, answerOptionId } = props;

  try {
    if (!next || !answerOptionId) {
      throw new Error();
    }

    if (typeof next === 'string') {
      return next;
    }

    return next[answerOptionId];
  } catch (e) {
    console.error(
      `[getNextQuestionId] cannot get next questionId for next value [${next}] and answerOptionId [${answerOptionId}]`
    );

    return null;
  }
}
