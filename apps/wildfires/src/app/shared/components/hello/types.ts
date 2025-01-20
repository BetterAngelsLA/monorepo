export type TQuestionnaire = {
  sections: TSection[];
};

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
  next?: string;
};

export type TOption = {
  optionId: string;
  label: string;
};

export type TAnswer = {
  questionId: string;
  optionId: string;
};
