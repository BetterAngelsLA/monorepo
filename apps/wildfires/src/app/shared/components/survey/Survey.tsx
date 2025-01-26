import { useContext, useEffect } from 'react';
import { mergeCss } from '../../utils/styles/mergeCss';
import { QuestionsBlock } from './QuestionsBlock';
import { Results } from './Results';
import { SurveyNav } from './SurveyNav';

import { SurveyContext } from './provider/SurveyContext';
import { SectionHeader } from './shared/SectionHeader';
import { TAnswer } from './types';
import { validateConfig } from './utils/validateConfig';

type IProps = {
  className?: string;
  onChange?: (results: TAnswer[]) => void;
};

export function Survey(props: IProps) {
  const { className, onChange } = props;

  const context = useContext(SurveyContext);

  if (!context) {
    throw new Error('SurveyContext must be used with Survey');
  }

  const { forms, currentForm, answers, goBack, setAnswers, setNextForm } =
    context;

  const configErrors = validateConfig(forms);

  if (configErrors.length) {
    console.error(configErrors);

    throw new Error('survey config forms missing');
  }

  function onClickNext() {
    if (!currentForm) {
      return;
    }

    setNextForm();
  }

  function onClickPrev() {
    goBack();
  }

  function handleAnswer(newAnswer: TAnswer) {
    console.log('new answer:');
    console.log(newAnswer);

    const existingIdx = answers.findIndex(
      (a) => a.questionId === newAnswer.questionId
    );

    // update existing answer
    if (existingIdx > -1) {
      setAnswers((prev) => {
        const updated = [...prev];
        updated[existingIdx] = newAnswer;

        return updated;
      });
    }

    // add new answer
    if (existingIdx < 0) {
      setAnswers((prev) => {
        return [...prev, newAnswer];
      });
    }
  }

  useEffect(() => {
    onChange && onChange(answers);
  }, [answers]);

  const parentCss = ['pt-8', className];

  if (!currentForm) {
    return <Results className="mt-24" />;
  }

  return (
    <div className={mergeCss(parentCss)}>
      <SectionHeader className="mb-12 md:mb-24" title={currentForm.title} />

      <QuestionsBlock
        questions={currentForm.questions}
        answers={answers}
        onAnswer={handleAnswer}
      />

      <SurveyNav
        className="mt-14 mb-14"
        onNext={onClickNext}
        onPrev={onClickPrev}
      />
    </div>
  );
}
