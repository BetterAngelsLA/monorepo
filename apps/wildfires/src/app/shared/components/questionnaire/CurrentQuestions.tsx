import { mergeCss } from '../../utils/styles/mergeCss';
import { Question } from './Question';
import { QuestionnaireNav } from './QuestionnaireNav';
import { TAnswer, TQuestion } from './questionnaire.types';

type IProps = {
  className?: string;
  questions: TQuestion[];
  onAnswer: (answer: TAnswer) => void;
  onClickNext?: () => void;
  onClickPrev?: () => void;
};

export function CurrentQuestions(props: IProps) {
  const {
    className,
    questions = [],
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

  return (
    <div className={mergeCss(parentCss)}>
      <div className="">
        {questions.map((question) => {
          return (
            <Question
              key={question.id}
              className="mt-8"
              question={question}
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
