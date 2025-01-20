import { useEffect, useState } from 'react';
import { QuestionsBlock } from './QuestionsBlock';
import { TAnswer, TQuestion, TResult } from './types';

type IProps = {
  questions: TQuestion[];
  answers: TAnswer[];
  onAnswer: (answer: TAnswer) => void;
  className?: string;
};

export function QuestionStepper(props: IProps) {
  const { questions, answers, onAnswer, className } = props;

  const [results, setResults] = useState<TResult[]>([]);

  const [lastQuestionId, setLastQuestionId] = useState<string>();

  const [currentQuestion, setCurrentQuestion] = useState<TQuestion>(
    questions[0]
  );

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

  function handleAnswer(answer: TAnswer) {
    // console.log();
    // console.log('| -------------  STEPPER handleAnswer  ------------- |');
    // console.log(answer);
    // console.log();

    onAnswer(answer);
  }

  useEffect(() => {
    console.log();
    console.log('| -------------  ANSWERS CHANGED  ------------- |');
    console.log(answers);
    console.log();
  }, [answers]);

  const renderQuestion = () => {
    // console.log();
    // console.log('| -------------  STEPPER RENDER  currentQuestion |');
    // console.log(currentQuestion);
    // console.log();

    if (!currentQuestion) {
      console.error('STEPPER - NO QUESTION');

      return;
    }

    // const currentQuestions: TQuestion[] = [];
    // const isFirstQuestion = visibleQuestions[0].id === questions[0].id;
    // const useNav = questions.some((q) => q.useNav === true);
    // const useNext = useNav;
    // const usePrev = useNav && !isFirstQuestion;

    return (
      <QuestionsBlock
        className="mt-8"
        questions={[currentQuestion]}
        answers={answers}
        onAnswer={handleAnswer}
        // onClickNext={useNext ? onClickNext : undefined}
        // onClickPrev={usePrev ? onClickPrev : undefined}
      />
    );
  };

  return <div>{renderQuestion()}</div>;
}
