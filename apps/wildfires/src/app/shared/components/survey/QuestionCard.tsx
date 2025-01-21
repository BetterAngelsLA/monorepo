import { mergeCss } from '../../utils/styles/mergeCss';
import { QuestionForm } from './QuestionForm';
import { TAnswer, TQuestion } from './types';

type IProps = {
  className?: string;
  question: TQuestion;
  answer?: string | string[];
  onAnswer: (answer: TAnswer) => void;
};

export function QuestionCard(props: IProps) {
  const { className, question, answer, onAnswer } = props;

  const parentCss = [className];

  return (
    <div className={mergeCss(parentCss)}>
      <h2>{question.question}</h2>

      <QuestionForm
        className=""
        question={question}
        answer={answer}
        onAnswer={onAnswer}
      />

      {!!question.renderAfter && question.renderAfter}
    </div>
  );
}
