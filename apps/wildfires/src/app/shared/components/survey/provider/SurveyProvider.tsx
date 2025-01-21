import { ReactElement, ReactNode, useEffect, useState } from 'react';
import { TAnswer, TFormBase, TFormConditional, TSurveyForm } from '../types';
import { findAnswerByQuestionId } from '../utils/findAnswer';
import { validateForm } from '../utils/validateForm';
import { SurveyContext, TSurveyUi } from './SurveyContext';

export type TSurveyProvider = {
  children: ReactNode;
  surveyForms: TSurveyForm[];
  ui?: TSurveyUi;
};

export default function SurveyProvider(props: TSurveyProvider): ReactElement {
  const { surveyForms, ui, children } = props;

  const initialForm = surveyForms[0];

  const [forms] = useState<TSurveyForm[]>(surveyForms);
  const [formHistory, setFormHistory] = useState<TSurveyForm[]>([initialForm]);
  const [currentForm, setCurrentForm] = useState<TSurveyForm>(initialForm);
  const [answers, setAnswers] = useState<TAnswer[]>([]);

  const getFormAnswerByQuestionId = (questionId: string) => {
    return findAnswerByQuestionId({
      answers,
      questionId,
    });
  };

  const getNextFormBase = () => {
    const form = currentForm as TFormBase;

    const next = form.next?.default;

    return forms.find((f) => f.id === next);
  };

  const getNextFormConditional = () => {
    const form = currentForm as TFormConditional;

    const next = form.next;

    if (!next) {
      return;
    }

    const question = form.questions[0];

    const answer = getFormAnswerByQuestionId(question.id);

    const answerResult = answer?.result;

    const nextQuestionIds = next.conditional;

    if (!nextQuestionIds) {
      return;
    }

    return forms.find((f) => f.id === nextQuestionIds[answerResult as string]);
  };

  const getNextForm = () => {
    if (!currentForm) {
      return;
    }

    if (!currentForm.conditional) {
      return getNextFormBase();
    }

    return getNextFormConditional();
  };

  const validateCurrentForm = () => {
    return validateForm({
      questions: currentForm.questions,
      answers: answers,
    });
  };

  const setNextForm = () => {
    const errors = validateForm({
      questions: currentForm.questions,
      answers: answers,
    });

    if (errors.length) {
      return;
    }

    const nextForm = getNextForm();

    if (nextForm) {
      setCurrentForm(nextForm);

      setFormHistory((prev) => {
        return [...prev, nextForm];
      });
    }
  };

  const goBack = () => {
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
