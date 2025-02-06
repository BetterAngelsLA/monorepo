import { mergeCss } from '../../utils/styles/mergeCss';
import { QuestionForm } from './QuestionForm';
import { QuestionHeader } from './shared/QuestionHeader';
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
      <QuestionHeader
        className="mb-12 md:mb-20"
        title={question.title}
        subtitle={question.subtitle}
      />
      <div className="text-xl md:mt-[-50px] mb-12 md:mb-20">
        {!!question.body && question.body}
      </div>
      <div className="text-neutral-40 md:mt-[-50px] mb-12 md:mb-20">
        {!!question.note && question.note}
      </div>

      {!!question.renderIn && question.renderIn}
      <QuestionForm question={question} answer={answer} onAnswer={onAnswer} />

      {!!question.renderAfter && question.renderAfter}
    </div>
  );
}
