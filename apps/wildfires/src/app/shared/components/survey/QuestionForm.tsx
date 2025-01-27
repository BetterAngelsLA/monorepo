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

  const optionContainerCss = [
    'flex',
    'flex-wrap',
    'gap-x-4',
    'gap-y-4',
    'md:gap-y-8',
  ];

  const optionCss = ['md:min-w-60', 'md:w-[300px]', 'md:min-h-24'];

  const radioGroupCss = [optionContainerCss, 'justify-start', parentCss];

  const checkboxGroupCss = [optionContainerCss, 'justify-center', parentCss];

  switch (question.type) {
    case 'radio':
      return (
        <div className={mergeCss(radioGroupCss)}>
          {question.options.map((option) => {
            const selected = optionSelected(option);

            return (
              <SurveyRadio
                className={mergeCss(optionCss)}
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
    case 'checkbox': {
      const options = question.options.map((option) => {
        return {
          label: option.label,
          value: option.optionId,
        };
      });

      return (
        <CheckboxGroup
          className={mergeCss(checkboxGroupCss)}
          options={options}
          values={answer as string[]}
          onChange={onCheckboxChange}
          CheckboxComponent={Checkbox}
          checkboxCss={mergeCss(optionCss)}
        />
      );
    }

    default:
  }
}
