import { useContext } from 'react';
import { SurveyRadio } from '../../../pages/introduction/firesSurvey/components/SurveyRadio';
import { mergeCss } from '../../utils/styles/mergeCss';
import { CheckboxGroup } from '../form/CheckboxGroup';
import { SurveyContext } from './provider/SurveyContext';
import { TAnswer, TOption, TQuestion } from './types';

type IProps = {
  className?: string;
  question: TQuestion;
  answer?: string | string[];
  onAnswer: (answer: TAnswer) => void;
};

export function QuestionForm(props: IProps) {
  const { className, question, answer, onAnswer } = props;

  const context = useContext(SurveyContext);

  if (!context) {
    throw new Error('SurveyContext must be used within a SurveyProvider');
  }

  const { ui = {} } = context;
  const { Checkbox } = ui;

  const parentCss = [className];

  function optionSelected(option: TOption) {
    return answer === option.optionId;
  }

  function onCheckboxChange(selected: string[]) {
    onAnswer({
      questionId: question.id,
      result: selected,
    });
  }

  switch (question.type) {
    case 'radio':
      return (
        <div className={mergeCss(parentCss)}>
          {question.options.map((option) => {
            const selected = optionSelected(option);

            return (
              <SurveyRadio
                className="mb-4 last:mb-0"
                key={option.optionId}
                name={option.optionId}
                label={option.label}
                selected={selected}
                onChange={() => {
                  onAnswer({
                    questionId: question.id,
                    result: option.optionId,
                  });
                }}
              />
            );
          })}
        </div>
      );
    case 'checkbox':
      const options = question.options.map((option) => {
        return {
          label: option.label,
          value: option.optionId,
        };
      });

      return (
        <div className={mergeCss(parentCss)}>
          <CheckboxGroup
            options={options}
            values={answer as string[]}
            onChange={onCheckboxChange}
            CheckboxComponent={Checkbox}
          />
        </div>
      );

    default:
  }
}
