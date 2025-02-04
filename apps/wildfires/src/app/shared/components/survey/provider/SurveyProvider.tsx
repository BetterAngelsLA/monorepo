import { ReactElement, ReactNode, useEffect, useState } from 'react';
import { TAnswer, TConditionRule, TSurveyForm, TSurveyResults } from '../types';
import { validateForm } from '../utils/validateForm';
import { SurveyContext, TSurveyUi } from './SurveyContext';

export type TSurveyProvider = {
  children: ReactNode;
  surveyForms: TSurveyForm[];
  ui?: TSurveyUi;
  onSurveyEnd?: (results: TSurveyResults) => void;
  onFormRender?: () => void;
  onFormBack?: () => void;
};

export default function SurveyProvider(props: TSurveyProvider): ReactElement {
  const { surveyForms, ui, onFormRender, onFormBack, onSurveyEnd, children } =
    props;

  const initialForm = surveyForms[0];

  const [forms] = useState<TSurveyForm[]>(surveyForms);
  const [formHistory, setFormHistory] = useState<TSurveyForm[]>([initialForm]);
  const [currentForm, setCurrentForm] = useState<TSurveyForm | null>(
    initialForm
  );
  const [answers, setAnswers] = useState<TAnswer[]>([]);

  const validateCurrentForm = () => {
    if (currentForm === null) {
      return [];
    }

    return validateForm({
      questions: currentForm.questions,
      answers: answers,
    });
  };

  const validateRule = (rule: TConditionRule): boolean => {
    const answer = answers.find((a) => a.questionId === rule.questionId);

    if (rule.type === 'answerExists') {
      return !!answer;
    }

    if (rule.type === 'answerEquals') {
      return answer?.result === rule.value;
    }

    if (rule.type === 'answerIncludes') {
      return answer?.result.includes(rule.value) || false;
    }

    return false;
  };

  const shouldShowform = (form: TSurveyForm): boolean => {
    const showConditions = form.showConditions;

    if (!showConditions) {
      return true;
    }

    if (showConditions.type === 'all') {
      return showConditions.rules.every((rule) => validateRule(rule));
    }

    return false;
  };

  const findNextForm = (formId: string | null): TSurveyForm | null => {
    const form = forms.find((f) => f.id === formId);

    if (!form) {
      return null;
    }

    if (shouldShowform(form)) {
      return form;
    }

    const nextFormId = form.nextFormId;

    if (!nextFormId) {
      return null;
    }

    return findNextForm(nextFormId);
  };

  const setNextForm = () => {
    if (!currentForm) {
      return;
    }

    const errors = validateForm({
      questions: currentForm.questions,
      answers: answers,
    });

    if (errors.length) {
      return;
    }

    const nextForm = findNextForm(currentForm.nextFormId);

    if (!nextForm) {
      // Exit Survey

      if (onSurveyEnd) {
        onSurveyEnd({
          answers,
        });
      }

      return setCurrentForm(null);
    }

    if (nextForm) {
      setCurrentForm(nextForm);

      if (onFormRender) {
        onFormRender();
      }

      setFormHistory((prev) => {
        return [...prev, nextForm];
      });
    }
  };

  const goBack = () => {
    // TODO: reconcile events such as onFormRender and onFormBack
    if (onFormBack) {
      onFormBack();
    }

    popQuestionHistory();
  };

  const popQuestionHistory = () => {
    if (!formHistory.length || formHistory.length < 2) {
      return;
    }

    setFormHistory((prev) => {
      const historyCopy = [...prev];

      historyCopy.pop();

      return historyCopy;
    });
  };

  useEffect(() => {
    if (!formHistory.length) {
      // setCurrentForm(null);

      // TODO: update next/back to work off of history - once have tests
      // - run onFormRender here?

      return;
    }

    const latestQuestion = formHistory[formHistory.length - 1];

    setCurrentForm(latestQuestion);
  }, [formHistory]);

  return (
    <SurveyContext.Provider
      value={{
        forms,
        currentForm,
        formHistory,
        answers,
        setNextForm,
        goBack,
        validateCurrentForm,
        setAnswers,
        ui,
      }}
    >
      {children}
    </SurveyContext.Provider>
  );
}
