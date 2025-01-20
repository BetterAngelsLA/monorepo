import { useState } from 'react';
import { CurrentQuestions } from './CurrentQuestions';
import {
  TAnswer,
  TQuestion,
  TQuestionAsked,
  TSurveyConfig,
} from './questionnaire.types';

type IProps = {
  config: TSurveyConfig;
  startIndex?: number;
  className?: string;
};

export function Questionnaire(props: IProps) {
  const { config, startIndex = 0 } = props;

  const [questions, setQuestions] = useState<TQuestion[]>(config.questions);

  const [answers, setAnswers] = useState<TAnswer[]>([]);
  const [currentStep, setCurrentStep] = useState(startIndex);
  const [questionsAsked, setQuestionsAsked] = useState<TQuestionAsked[]>([
    {
      index: startIndex,
    },
  ]);

  const currentQuestion = questions[currentStep];

  const handleChange = (answer: TAnswer) => {
    console.log();
    console.log('| -------------  ROOT-ANSWER  ------------- |');
    console.log(answer);
    console.log();

    const questionIdx = questions.findIndex((q) => q.id === answer.questionId);

    console.log('*****************  questionIdx:', questionIdx);

    if (questionIdx < 0) {
      console.error('[Questionnaire] question not found');

      return;
    }

    // update answer
    setQuestions((prev) => {
      const qestionsCopy = [...prev];

      const question = qestionsCopy[questionIdx];

      qestionsCopy[questionIdx] = {
        ...question,
        answer: answer,
      };

      return qestionsCopy;
    });

    if (currentQuestion.useNav) {
      console.log('################## USE NAV');
      return;
    }

    const val = Array.isArray(answer.value) ? answer.value[0] : answer.value;

    setNextStep(val as string);

    return;
  };

  const setNextStep = (value: string | boolean) => {
    const next = currentQuestion.next;

    let nextIndex: number;

    if (typeof next === 'string') {
      nextIndex = config.questions.findIndex((q) => q.id === next);
    } else {
      const nextStep = next[value as keyof typeof next];

      nextIndex = config.questions.findIndex((q) => q.id === nextStep);
    }

    if (nextIndex && nextIndex >= 0) {
      setCurrentStep(nextIndex);

      setQuestionsAsked((prev) => {
        return [
          ...prev,
          {
            index: nextIndex,
          },
        ];
      });
    }
  };

  function onClickNext() {
    console.log('################################### CLICK NEXT');
    console.log(
      '*****************  currentQuestion.answer:',
      currentQuestion.answer
    );

    const currentAnswer = currentQuestion.answer;

    if (!currentAnswer) {
      return;
    }

    const val = Array.isArray(currentAnswer.value)
      ? currentAnswer.value[0]
      : currentAnswer.value;

    setNextStep(val as string);
  }

  function onClickPrev() {
    console.log('################################### CLICK PREV');
    if (questionsAsked.length < 2) {
      return;
    }

    const prevQuestionIdx = questionsAsked[questionsAsked.length - 2].index;

    setCurrentStep(prevQuestionIdx);

    const questionsAskedCopy = [...questionsAsked];

    questionsAskedCopy.pop();

    setQuestionsAsked(questionsAskedCopy);
  }

  const renderQuestion = () => {
    if (!currentQuestion) {
      console.error('NO QUESTION');
      return renderResults();
    }

    const currentQuestions = [currentQuestion];

    const isFirstQuestion = currentQuestions[0].id === questions[0].id;

    const useNav = questions.some((q) => q.useNav === true);

    const useNext = useNav;
    const usePrev = useNav && !isFirstQuestion;

    return (
      <CurrentQuestions
        className="mt-8"
        questions={currentQuestions}
        onAnswer={handleChange}
        onClickNext={useNext ? onClickNext : undefined}
        onClickPrev={usePrev ? onClickPrev : undefined}
      />
    );
  };

  const renderResults = () => {
    return (
      <div className="m-4 mt-12">
        <h2>Results</h2>
        {/* {Object.entries(formData).map(([key, value]) => (
          <p key={key}>{`${key}: ${value}`}</p>
        ))} */}
      </div>
    );
  };

  return <div>{renderQuestion()}</div>;
}
