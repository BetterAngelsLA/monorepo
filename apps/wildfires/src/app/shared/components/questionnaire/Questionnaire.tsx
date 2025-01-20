import { useState } from 'react';
import { CurrentQuestions } from './CurrentQuestions';
import { TQuestion, TResult } from './questionnaire.types';
import { getNextQuestion } from './utils/getNextQuestion';
import { getQuestionById } from './utils/getQuestionById';
import { getQuestionsByIds } from './utils/getQuestionsByIds';

type IProps = {
  questions: TQuestion[];
  startIds: string[];
  className?: string;
};

export function Questionnaire(props: IProps) {
  const { questions, startIds } = props;

  const [results, setResults] = useState<TResult[]>([]);

  const [screens, setScreens] = useState<string[]>();
  const [lastQuestionId, setLastQuestionId] = useState<string>();

  const [currentQuestion, setCurrentQuestion] = useState<TQuestion | undefined>(
    getQuestionById(questions, startIds[0])
  );

  const [visibleQuestions, setVisibleQuestions] = useState<TQuestion[]>(
    getQuestionsByIds(questions, startIds)
  );

  const updateResults = (result: TResult) => {
    console.log();
    console.log('| -------------  ROOT-ANSWER  ------------- |');
    console.log(result);
    console.log();

    const existingResultIdx = results.findIndex(
      (r) => r.questionId === result.questionId
    );

    // update existing result
    if (existingResultIdx > -1) {
      setResults((prev) => {
        const updated = [...prev];
        updated[existingResultIdx] = result;

        return updated;
      });
    }

    // add new answer
    if (existingResultIdx < 0) {
      setResults((prev) => {
        return [...prev, result];
      });
    }

    // const questionIdx = questions.findIndex((q) => q.id === answer.questionId);

    // if (questionIdx < 0) {
    //   console.error('[Questionnaire] question not found');

    //   return;
    // }

    // // update answer
    // setQuestions((prev) => {
    //   const qestionsCopy = [...prev];

    //   const question = qestionsCopy[questionIdx];

    //   qestionsCopy[questionIdx] = {
    //     ...question,
    //     answer: answer,
    //   };

    //   return qestionsCopy;
    // });

    // if (currentQuestion.useNav) {
    //   console.log('################## USE NAV');
    //   return;
    // }

    // const val = Array.isArray(answer.value) ? answer.value[0] : answer.value;

    // setNextStep(val as string);

    // return;
  };

  // const currentQuestion = questions[currentStep];

  // const setNextStep = (value: string | boolean) => {
  //   const next = currentQuestion.next;

  //   let nextIndex: number;

  //   if (typeof next === 'string') {
  //     nextIndex = config.questions.findIndex((q) => q.id === next);
  //   } else {
  //     const nextStep = next[value as keyof typeof next];

  //     nextIndex = config.questions.findIndex((q) => q.id === nextStep);
  //   }

  //   if (nextIndex && nextIndex >= 0) {
  //     setCurrentStep(nextIndex);

  //     setQuestionsAsked((prev) => {
  //       return [
  //         ...prev,
  //         {
  //           index: nextIndex,
  //         },
  //       ];
  //     });
  //   }
  // };

  function validateQuestion(questionId: string): boolean {
    const result = getCurrentResult(questionId);

    if (!result) {
      return false;
    }

    return !!result.value;
  }

  function getCurrentResult(currentQuestionId: string) {
    return results.find((r) => r.questionId === currentQuestionId);
  }

  function onClickNext() {
    if (!currentQuestion) {
      return;
    }

    const currentValid = validateQuestion(currentQuestion.id);

    if (!currentValid) {
      return;
    }

    const currentQuestionId = currentQuestion.id;

    const result = getCurrentResult(currentQuestionId);

    console.log();
    console.log('| -------------  result  ------------- |');
    console.log(result);
    console.log();

    const nextQuestions = getNextQuestion({
      questions,
      currentQuestion,
      currentResult: result,
    });

    console.log();
    console.log('| -------------  nextQuestions  ------------- |');
    console.log(nextQuestions);
    console.log();

    if (!nextQuestions.length) {
      return;
    }

    console.log('*****************  on-next: NEW CURRENT Q:', nextQuestions[0]);

    setCurrentQuestion(nextQuestions[0]);
    setVisibleQuestions(nextQuestions);
    setLastQuestionId(currentQuestionId);
  }

  function onClickPrev() {
    console.log('################## PREV');
    console.log(lastQuestionId);

    if (!lastQuestionId) {
      return;
    }

    const lastQuestion = getQuestionById(questions, lastQuestionId);

    if (!lastQuestion) {
      return;
    }

    setCurrentQuestion(lastQuestion);
    setVisibleQuestions([lastQuestion]);
  }

  const renderQuestions = () => {
    console.log();
    console.log('| -------------  RENDER  visibleQuestions  ------------- |');
    console.log(visibleQuestions);
    console.log();

    console.log();
    console.log('| -------------  RENDER results  ------------- |');
    console.log(results);
    console.log();

    if (!visibleQuestions.length || !currentQuestion) {
      console.error('NO QUESTION');
      return;
    }
    // const currentQuestions: TQuestion[] = [];

    const isFirstQuestion = visibleQuestions[0].id === questions[0].id;
    const useNav = questions.some((q) => q.useNav === true);
    const useNext = useNav;
    const usePrev = useNav && !isFirstQuestion;

    return (
      <CurrentQuestions
        className="mt-8"
        questions={visibleQuestions}
        answers={results}
        onAnswer={updateResults}
        onClickNext={useNext ? onClickNext : undefined}
        onClickPrev={usePrev ? onClickPrev : undefined}
      />
    );
  };

  return <div>{renderQuestions()}</div>;
}
