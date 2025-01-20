import { mergeCss } from '../../utils/styles/mergeCss';
import { TAnswer, TOption, TQuestion } from './types';

type IProps = {
  className?: string;
  question: TQuestion;
  answer?: string | string[];
  onAnswer: (answer: TAnswer) => void;
};

export function QuestionCard(props: IProps) {
  const { className, question, answer, onAnswer } = props;

  const parentCss = [className];

  //   console.log();
  //   console.log('| -------------  QuestionCard  ------------- |');
  //   console.log(question);
  //   console.log();

  function optionSelected(option: TOption) {
    return answer === option.optionId;
  }

  const optionCss = 'mx-2 my-4 py-1.5 px-4 border border-2 rounded-xl';

  switch (question.type) {
    case 'radio':
      return (
        <div className={mergeCss(parentCss)}>
          <h2>{question.question}</h2>
          {question.options.map((option) => {
            const selected = optionSelected(option);

            return (
              <button
                key={option.optionId}
                onClick={() =>
                  onAnswer({
                    questionId: question.id,
                    optionId: option.optionId,
                  })
                }
                className={`${optionCss} ${selected ? 'border-red-500' : ''}`}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      );
    default:
  }
}
