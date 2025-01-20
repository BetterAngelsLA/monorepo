export type TQuestionnaire = {
  sections: TSection[];
};

type TNestedTarget = {
  [key: string]: string;
};

export type TNextQTarget = string | TNestedTarget;

export type TSection = {
  id: string;
  title: string;
  questions: TQuestion[];
  stepper?: boolean;
  next?: string;
};

export type TQuestion = {
  id: string;
  type: 'radio';
  question: string;
  options: TOption[];
  next?: TNextQTarget;
};

export type TOption = {
  optionId: string;
  label: string;
};

export type TAnswer = {
  questionId: string;
  optionId: string;
};

export type TResult = {
  questionId: string;
  value: string | string[];
  error?: string;
};
