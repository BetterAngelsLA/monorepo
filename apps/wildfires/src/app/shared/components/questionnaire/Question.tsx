import { mergeCss } from '../../utils/styles/mergeCss';
import { TAnswer, TOption, TQuestion } from './questionnaire.types';

type IProps = {
  className?: string;
  question: TQuestion;
  answer?: string | string[];
  onChange: (value: TAnswer) => void;
};

export function Question(props: IProps) {
  const { className, question, answer, onChange } = props;

  const parentCss = [className];

  function optionSelected(option: TOption) {
    return answer === option.id;
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
                key={option.id}
                onClick={() =>
                  onChange({
                    questionId: question.id,
                    value: option.id,
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
    case 'text':
      return (
        <div className={mergeCss(parentCss)}>
          <h2>{question.question}</h2>
          <input
            type="text"
            onBlur={(e) =>
              onChange({
                questionId: question.id,
                value: e.target.value,
              })
            }
          />
        </div>
      );
    default:
  }
}
