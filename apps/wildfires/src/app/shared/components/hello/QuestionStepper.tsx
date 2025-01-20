import { useContext, useEffect, useState } from 'react';
import { QuestionsBlock } from './QuestionsBlock';
import { QuestionnaireContext } from './provider/questionnaireContext';
import { TAnswer, TQuestion, TResult } from './types';

type IProps = {
  questions: TQuestion[];
  answers: TAnswer[];
  onAnswer: (answer: TAnswer) => void;
  className?: string;
};

export function QuestionStepper(props: IProps) {
  const { questions, answers, onAnswer, className } = props;

  const context = useContext(QuestionnaireContext);

  if (!context) {
    throw new Error(
      'QuestionnaireContext must be used with QuestionnaireWrapper'
    );
  }

  const { currentQuestion, setNextQuestion } = context;

  useEffect(() => {
    if (questions?.length > 0 && !currentQuestion) {
      setNextQuestion(questions);
    }
  }, [questions, currentQuestion, setNextQuestion]);

  const [results, setResults] = useState<TResult[]>([]);

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
    onAnswer(answer);
  }

  useEffect(() => {}, [answers]);

  const renderQuestion = () => {
    if (!currentQuestion) {
      return null;
    }

    return (
      <QuestionsBlock
        className="mt-8"
        questions={[currentQuestion]}
        answers={answers}
        onAnswer={handleAnswer}
      />
    );
  };

  return <div>{renderQuestion()}</div>;
}
