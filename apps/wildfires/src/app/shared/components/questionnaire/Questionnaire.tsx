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
    console.log('| -------------  ROOT answer  ------------- |');
    console.log(answer);
    console.log();

    // const existingIdx = answers.findIndex((a) => a.id === answer.id);
    const questionIdx = questions.findIndex((q) => q.id === answer.id);

    if (questionIdx < 0) {
      console.error('[Questionnaire] question not found');

      return;
    }

    // update answer
    return setQuestions((prev) => {
      const qestionsCopy = [...prev];

      const question = qestionsCopy[questionIdx];

      qestionsCopy[questionIdx] = {
        ...question,
        answer: answer.answer,
      };

      return qestionsCopy;
    });

    // // update answer
    // if (existingIdx > -1) {
    //   return setAnswers((prev) => {
    //     const updated = [...prev];

    //     updated[existingIdx] = answer;

    //     return updated;
    //   });
    // }

    // // append new answer
    // setAnswers((prev) => {
    //   const updated = [...prev];

    //   updated.push(answer);

    //   return updated;
    // });

    // const val = Array.isArray(answer.answer) ? answer.answer[0] : answer.answer;

    // setNextStep(val as string);
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

  const renderQuestion = () => {
    console.log();
    console.log('| -------------  RENDER currentQuestion  ------------- |');
    if (!currentQuestion) {
      console.error('NO QUESTION');
      return renderResults();
    }

    // console.log();
    // console.log('| -------------  answers  ------------- |');
    // console.log(answers);
    // console.log();

    return (
      <CurrentQuestions
        className="mt-8"
        questions={[currentQuestion]}
        onAnswer={handleChange}
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
