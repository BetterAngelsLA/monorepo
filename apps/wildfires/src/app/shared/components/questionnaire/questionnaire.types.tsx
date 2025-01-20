type TNestedTarget = {
  [key: string]: string[] | TNextTarget;
  // [key in TQuestion['options'][number]]: string | TNextTarget;
  // children?: ReactNode;
};

export type TNextTarget = string[] | TNestedTarget;

export type TQuestion = {
  id: string;
  question: string;
  type: 'radio' | 'text';
  options: TOption[];
  next: TNextTarget;

  answer?: TAnswer;
  validation?: TValidation;
  showBelow?: boolean;
  useNav?: boolean;
};

export type TSurveyConfig = {
  questions: TQuestion[];
};

export type TResult = {
  questionId: string;
  value: string | string[];
  error?: string;
};

export type TOption = {
  id: string;
  label: string;
};

export type TValidation = {
  required?: boolean;
};

export type TAnswer = {
  questionId: string;
  value: string | string[];
  error?: string;
};
