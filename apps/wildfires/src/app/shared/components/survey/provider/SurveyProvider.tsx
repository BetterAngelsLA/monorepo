import { ReactNode, useState } from 'react';
import { TAnswer, TSurveyForm, TSurveyResults } from '../types';
import { validateConfig } from '../utils/validateConfig';
import { validateForm } from '../utils/validateForm';
import { resolveRoute } from '../utils/navigation';
import { SurveyContext, TSurveyUi } from './SurveyContext';

export type TSurveyProvider = {
  children: ReactNode;
  /** Configuration is fixed for a session. Change the provider key to start a new survey. */
  surveyForms: TSurveyForm[];
  ui?: TSurveyUi;
  onSurveyEnd?: (results: TSurveyResults) => void;
  onFormRender?: () => void;
  onFormBack?: () => void;
};

export default function SurveyProvider({
  surveyForms,
  ui,
  onFormRender,
  onFormBack,
  onSurveyEnd,
  children,
}: TSurveyProvider) {
  const [forms] = useState(() => {
    const errors = validateConfig(surveyForms);
    if (errors.length) throw new Error(errors.join('\n'));
    return surveyForms;
  });
  const [navigation, setNavigation] = useState({
    history: [forms[0]],
    complete: false,
  });
  const [answers, setAnswers] = useState<TAnswer[]>([]);
  const formHistory = navigation.history;
  const currentForm = navigation.complete
    ? null
    : formHistory[formHistory.length - 1];
  const validateCurrentForm = () =>
    currentForm
      ? validateForm({ questions: currentForm.questions, answers })
      : [];

  function setNextForm() {
    if (!currentForm || validateCurrentForm().length) return;
    const resolved = resolveRoute(forms, answers);
    const nextForm =
      resolved.route[
        resolved.route.findIndex((form) => form.id === currentForm.id) + 1
      ];
    // Route resolution only removes answers; preserve identity if nothing changed.
    if (resolved.answers.length !== answers.length)
      setAnswers(resolved.answers);
    if (nextForm) {
      setNavigation({ history: [...formHistory, nextForm], complete: false });
      onFormRender?.();
    } else {
      setNavigation({ history: formHistory, complete: true });
      onSurveyEnd?.({ answers: resolved.answers });
    }
  }

  function goBack() {
    if (navigation.complete || formHistory.length < 2) return;
    setNavigation({ history: formHistory.slice(0, -1), complete: false });
    onFormBack?.();
  }

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
