import { mergeCss } from '../../utils/styles/mergeCss';
import { QuestionCard } from './QuestionCard';
import { TAnswer, TQuestion } from './types';

type IProps = {
  questions: TQuestion[];
  className?: string;
  onAnswer: (answer: TAnswer) => void;
  answers: TAnswer[];
};

export function QuestionsBlock(props: IProps) {
  const { className, questions, answers, onAnswer } = props;

  const parentCss = [className];

  function handleAnswer(answer: TAnswer) {
    onAnswer(answer);
  }

  function findQuestionResult(
    question: TQuestion,
    answers: TAnswer[]
  ): string | string[] {
    const answer = answers.find((a) => a.questionId === question.id);

    return answer?.result || '';
  }

  return (
    <div className={mergeCss(parentCss)}>
      {questions.map((question) => {
        return (
          <QuestionCard
            key={question.id}
            className="mt-8"
            question={question}
            answer={findQuestionResult(question, answers)}
            onAnswer={handleAnswer}
          />
        );
      })}
    </div>
  );
}
