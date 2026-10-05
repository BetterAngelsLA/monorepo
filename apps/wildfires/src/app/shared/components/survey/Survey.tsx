import { mergeCss } from '@monorepo/react/shared';
import { useEffect, useEffectEvent } from 'react';
import { QuestionsBlock } from './QuestionsBlock';
import { Results } from './Results';
import { SurveyNav } from './SurveyNav';

import { useSurvey } from './provider/SurveyContext';
import { SectionHeader } from './shared/SectionHeader';
import { TAnswer } from './types';

type IProps = {
  className?: string;
  onChange?: (results: TAnswer[]) => void;
};

export function Survey(props: IProps) {
  const { className, onChange } = props;

  const context = useSurvey();

  const { currentForm, answers, goBack, setAnswers, setNextForm } = context;

  function handleAnswer(newAnswer: TAnswer) {
    setAnswers((previous) => {
      const exists = previous.some(
        (answer) => answer.questionId === newAnswer.questionId,
      );
      return exists
        ? previous.map((answer) =>
            answer.questionId === newAnswer.questionId ? newAnswer : answer,
          )
        : [...previous, newAnswer];
    });
  }

  const emitChange = useEffectEvent((results: TAnswer[]) => {
    onChange?.(results);
  });

  // Notify when answers change, using the latest onChange without reacting to it.
  useEffect(() => {
    emitChange(answers);
  }, [answers]);

  const parentCss = ['pt-8', className];

  if (!currentForm) {
    return <Results className={mergeCss(['mt-24', className])} />;
  }

  return (
    <div className={mergeCss(parentCss)}>
      <SectionHeader className="mb-12 md:mb-24" title={currentForm.title} />

      <QuestionsBlock
        questions={currentForm.questions}
        answers={answers}
        onAnswer={handleAnswer}
      />

      <SurveyNav className="mt-14 mb-14" onNext={setNextForm} onPrev={goBack} />
    </div>
  );
}
