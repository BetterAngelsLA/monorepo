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

export type TQuestion = {
  id: string;
  noNav?: boolean;
  question: string;
  type: 'radio' | 'text';
  options: TOption[];
  next: TNextTarget;
  inline?: boolean;
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
};
