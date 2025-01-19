import { mergeCss } from '../../utils/styles/mergeCss';
import { Question } from './Question';
import { QuestionnaireNav } from './QuestionnaireNav';
import { TAnswer, TQuestion } from './questionnaire.types';

type IProps = {
  className?: string;
  questions: TQuestion[];
  onAnswer: (answer: TAnswer) => void;
};

export function CurrentQuestions(props: IProps) {
  const { className, questions = [], onAnswer } = props;

  const parentCss = [className];

  function onClickNext() {
    console.log('click NEXT');
  }

  function onClickPrev() {
    console.log('click PREV');
  }

  function handleAnswer(answer: TAnswer) {
    onAnswer(answer);
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
              onChange={handleAnswer}
            />
          );
        })}
      </div>
      <QuestionnaireNav
        className="mt-4"
        onNext={onClickNext}
        onPrev={onClickPrev}
      />
    </div>
  );
}
