import { mergeCss } from '../../utils/styles/mergeCss';
import { TAnswer, TOption, TQuestion } from './questionnaire.types';

type IProps = {
  className?: string;
  question: TQuestion;
  onChange: (value: TAnswer) => void;
};

export function Question(props: IProps) {
  const { className, question, onChange } = props;

  const parentCss = [className];

  // console.log();
  // console.log('| -------------  Question ANSWER  ------------- |');
  // console.log(question.answer);
  // console.log();

  function optionSelected(option: TOption) {
    return question.answer === option.id;
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
                    id: question.id,
                    answer: option.id,
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
                id: question.id,
                answer: e.target.value,
              })
            }
          />
        </div>
      );
    default:
  }
}
