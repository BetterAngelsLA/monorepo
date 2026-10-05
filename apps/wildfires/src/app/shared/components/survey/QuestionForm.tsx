import { mergeCss } from '@monorepo/react/shared';
import { useId } from 'react';
import { SurveyRadio } from '../../../pages/introduction/firesSurvey/components/SurveyRadio';
import { CheckboxGroup } from '../form/CheckboxGroup';
import { useSurvey } from './provider/SurveyContext';
import { TAnswer, TQuestion } from './types';

type Props = {
  className?: string;
  question: TQuestion;
  answer?: TAnswer['result'];
  onAnswer: (answer: TAnswer) => void;
};

export function QuestionForm({ className, question, answer, onAnswer }: Props) {
  const { ui } = useSurvey();
  const groupId = useId();
  const groupCss = mergeCss([
    'flex flex-wrap gap-x-4 gap-y-4 md:gap-y-8 justify-center',
    className,
  ]);
  const optionCss = 'md:min-w-60 md:w-[300px] md:min-h-24';

  function answerRadio(result: TAnswer<'radio'>['result']) {
    onAnswer({ questionId: question.id, result });
  }

  function answerCheckbox(result: TAnswer<'checkbox'>['result']) {
    onAnswer({ questionId: question.id, result });
  }

  switch (question.type) {
    case 'radio':
      return (
        <div role="radiogroup" aria-label={question.title} className={groupCss}>
          {question.options.map((option) => (
            <SurveyRadio
              key={option.optionId}
              className={optionCss}
              name={groupId}
              value={option.optionId}
              label={option.label}
              selected={answer === option.optionId}
              onChange={answerRadio}
            />
          ))}
        </div>
      );
    case 'checkbox':
      return (
        <div role="group" aria-label={question.title}>
          <CheckboxGroup
            className={groupCss}
            options={question.options.map((option) => ({
              label: option.label,
              value: option.optionId,
            }))}
            values={Array.isArray(answer) ? answer : []}
            onChange={answerCheckbox}
            CheckboxComponent={ui?.Checkbox}
            checkboxCss={optionCss}
          />
        </div>
      );
  }
}
