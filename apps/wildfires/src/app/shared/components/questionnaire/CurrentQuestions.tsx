import { mergeCss } from '../../utils/styles/mergeCss';
import { Question } from './Question';
import { QuestionnaireNav } from './QuestionnaireNav';
import { TAnswer, TQuestion, TResult } from './questionnaire.types';

type IProps = {
  className?: string;
  questions: TQuestion[];
  answers: TResult[];
  onAnswer: (answer: TAnswer) => void;
  onClickNext?: () => void;
  onClickPrev?: () => void;
};

export function CurrentQuestions(props: IProps) {
  const {
    className,
    questions = [],
    answers = [],
    onAnswer,
    onClickPrev,
    onClickNext,
  } = props;

  const parentCss = [className];

  function handleAnswer(answer: TAnswer) {
    if (!answer.error) {
      onAnswer(answer);
    }
  }

  const useNav = !!onClickNext || !!onClickPrev;

  function questionResult(
    question: TQuestion,
    answers: TResult[]
  ): string | string[] {
    const answer = answers.find((a) => a.questionId === question.id);

    return answer?.value || '';
  }

  return (
    <div className={mergeCss(parentCss)}>
      <div className="">
        {questions.map((question) => {
          return (
            <Question
              key={question.id}
              className="mt-8"
              question={question}
              answer={questionResult(question, answers)}
              onChange={handleAnswer}
            />
          );
        })}
      </div>
      {useNav && (
        <QuestionnaireNav
          className="mt-4"
          onNext={onClickNext}
          onPrev={onClickPrev}
        />
      )}
    </div>
  );
}
