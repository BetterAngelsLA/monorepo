export type Question = {
    id: string;
    question: string;
    type: 'radio' | 'text';
    options: string[];
    next: string | { [key: string]: string };
  };

export type SurveyConfig = {
    questions: Question[];
  };
