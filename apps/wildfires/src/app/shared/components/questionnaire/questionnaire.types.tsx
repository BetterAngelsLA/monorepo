type TNestedTarget = {
  [key: string]: string | TNextTarget;
  // [key in TQuestion['options'][number]]: string | TNextTarget;
  // children?: ReactNode;
};

export type TNextTarget = string | TNestedTarget;

export type TOption = {
  id: string;
  label: string;
};

export type TValidation = {
  required?: boolean;
};

export type TQuestion = {
  id: string;
  question: string;
  type: 'radio' | 'text';
  options: TOption[];
  next: TNextTarget;

  validation?: TValidation;
  inline?: boolean;
  useNav?: boolean;
  answer?: string | string[];
};

export type TSurveyConfig = {
  questions: TQuestion[];
};

export type TQuestionAsked = {
  index: number;
  answer?: string;
};

export type TAnswer = {
  id: string;
  answer: string | string[];
  error?: string;
};
