import { ReactNode } from 'react';

export type TConditionRule =
  | {
      type: 'answerIncludes' | 'answerEquals';
      questionId: string;
      value: string;
    }
  | {
      type: 'answerExists';
      questionId: string;
    };

export type TShowConditions = {
  type: 'all';
  rules: TConditionRule[];
};

export type TSurveyForm = {
  id: string;
  title: string;
  questions: TQuestion[];
  showConditions?: TShowConditions;
  nextFormId: string | null;
};

export type TSurvey = TSurveyForm[];

export type TQuestion = {
  id: string;
  type: 'radio' | 'checkbox';
  title: string;
  body?: string;
  subtitle?: string;
  note?: React.ReactNode;
  options: TOption[];
  rules?: TQuestionValidate;
  renderAfter?: ReactNode;
  renderIn?: ReactNode;
};

export type TQuestionValidate = {
  required?: boolean;
};

export type TOption = {
  optionId: string;
  label: string;
  next?: string;
  tags?: string[];
};

export type TAnswer = {
  questionId: string;
  result: string | string[];
};

export type TSurveyResults = {
  answers: TAnswer[];
};
