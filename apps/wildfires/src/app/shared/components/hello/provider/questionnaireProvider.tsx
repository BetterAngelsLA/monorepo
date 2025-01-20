import { ReactElement, ReactNode, useEffect, useState } from 'react';
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

  const [questionHistory, setQuestionHistory] = useState<TQuestion[]>([]);
  const [answers, setAnswers] = useState<TAnswer[]>([]);

  const clearQuestionHistory = () => {
    setQuestionHistory([]);
  };

  const getLastQuestionHistoryId = () => {
    if (!questionHistory?.length) {
      return null;
    }

    return questionHistory[questionHistory.length - 1];
  };

  const popQuestionHistory = () => {
    if (!questionHistory.length || questionHistory.length < 2) {
      return;
    }

    setQuestionHistory((prev) => {
      const historyCopy = [...prev];

      historyCopy.pop();

      return historyCopy;
    });
  };

  const setNextQuestion = (questions: TQuestion[]) => {
    if (!questions) {
      return;
    }

    if (!currentQuestion) {
      setQuestionHistory([questions[0]]);

      return;
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
      clearQuestionHistory();

      return;
    }

    const answerOptionId = currentQuestionAnswer.optionId;

    const nextQuestionId = getNextQuestionId({
      next,
      answerOptionId,
    });

    const nextQuestion = findQuestionById(questions, nextQuestionId as string);

    if (nextQuestion) {
      setCurrentQuestion(nextQuestion);

      setQuestionHistory((prev) => {
        return [...prev, nextQuestion];
      });

      return;
    }

    console.error(
      `[setNextQuestion] could not find question by Id [${nextQuestionId}].`
    );

    return;
  };

  useEffect(() => {
    if (!questionHistory.length) {
      setCurrentQuestion(null);

      return;
    }

    const latestQuestion = questionHistory[questionHistory.length - 1];

    setCurrentQuestion(latestQuestion);
  }, [questionHistory]);

  return (
    <QuestionnaireContext.Provider
      value={{
        currentQuestion,
        setNextQuestion,
        answers,
        setAnswers,
        questionHistory,
        getLastQuestionHistoryId,
        popQuestionHistory,
        clearQuestionHistory,
      }}
    >
      {children}
    </QuestionnaireContext.Provider>
  );
}
