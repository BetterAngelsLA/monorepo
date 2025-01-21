import { ReactNode } from 'react';

export type TNextStep = {
  default?: string;
  conditional?: {
    [key: string]: string;
  };
};

export type TFormBase = {
  id: string;
  conditional?: false;
  title: string;
  questions: TQuestion[];
  next?: {
    default: string;
  };
};

export type TFormConditional = {
  id: string;
  conditional: true;
  title: string;
  questions: [TQuestion];
  next?: TNextStep;
};

export type TSurveyForm = TFormBase | TFormConditional;

export type TSurvey = TSurveyForm[];

export type TQuestion = {
  id: string;
  type: 'radio' | 'checkbox';
  question: string;
  options: TOption[];
  rules?: TQuestionValidate;
  renderAfter?: ReactNode;
  next?: TNextStep;
};

export type TQuestionValidate = {
  required?: boolean;
};

export type TOption = {
  optionId: string;
  label: string;
  next?: string;
};

export type TAnswer = {
  questionId: string;
  result: string | string[];
};
