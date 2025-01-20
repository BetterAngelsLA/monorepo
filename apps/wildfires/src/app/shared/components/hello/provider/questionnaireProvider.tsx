import { ReactElement, ReactNode, useState } from 'react';
import { TAnswer, TQuestion } from '../types';
import { findQuestionById } from '../utils/findQuestionById';
import { getNextQuestionId } from '../utils/getNextQuestionId';
import { QuestionnaireContext } from './questionnaireContext';

type TQuestionnaireProvider = {
  children: ReactNode;
};

export default function QuestionnaireProvider(
  props: TQuestionnaireProvider
): ReactElement {
  const { children } = props;

  const [currentQuestion, setCurrentQuestion] = useState<TQuestion | null>(
    null
  );

  const [answers, setAnswers] = useState<TAnswer[]>([]);

  const setNextQuestion = (questions: TQuestion[]) => {
    if (!questions) {
      return;
    }

    if (!currentQuestion) {
      return setCurrentQuestion(questions[0]);
    }

    const currentQuestionAnswer = answers.find(
      (a) => a.questionId === currentQuestion.id
    );

    // no answer yet, do nothing
    if (!currentQuestionAnswer) {
      return;
    }

    const next = currentQuestion.next;

    // no next question
    if (!next) {
      setCurrentQuestion(null);

      return;
    }

    const answerOptionId = currentQuestionAnswer.optionId;

    const nextQuestionId = getNextQuestionId({
      next,
      answerOptionId,
    });

    const nextQuestion = findQuestionById(questions, nextQuestionId as string);

    if (nextQuestion) {
      return setCurrentQuestion(nextQuestion);
    }

    console.error(
      `[setNextQuestion] could not find question by Id [${nextQuestionId}].`
    );

    return;
  };

  return (
    <QuestionnaireContext.Provider
      value={{ currentQuestion, setNextQuestion, answers, setAnswers }}
    >
      {children}
    </QuestionnaireContext.Provider>
  );
}
