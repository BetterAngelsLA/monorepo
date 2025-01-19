// export type TNextNested = {
//   [key: string]: string | TNextTarget;
// } & {
//   children?: ReactNode;
// };

// export type TNextTarget = {
//   [key in TQuestion['options'][number]]: string;
//   // [key: string]: string | ReactNode;
//   // children?: ReactNode;
// };

// export type TNextNested = {
//   [key in TQuestion['options'][number]]: string | TNextTarget;
//   children?: ReactNode;
// };

// export type TNextNested = {
//   [key in TQuestion['options'][number]]: string | TNextTarget;
// } & {
//   children?: ReactNode; // Special key for rendering custom content
// };

// export type TNextTarget = string | TNextNested;

// export type TNextNested = {
//   [key in TQuestion['options'][number]]: TNextTarget;
//   children?: ReactNode;
//   // [key: string]: string | TNextTarget;
// };

// export type TNextTarget =
//   | string // Simple next step as a string (ID)
//   // TNextNested & { children?: ReactNode };
//   | TNextNested;

// type Thello = {
//   [key in TQuestion['options'][number]]: string | TNextTarget;
// } & {
//   children?: ReactNode;
// };

type Thello = {
  [key: string]: string | TNextTarget;
  // [key in TQuestion['options'][number]]: string | TNextTarget;
  // children?: ReactNode;
};

export type TNextTarget = string | Thello;

export type TQuestion = {
  id: string;
  noNav?: boolean;
  question: string;
  type: 'radio' | 'text';
  options: string[];
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
