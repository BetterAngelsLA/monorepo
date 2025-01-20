import { Dispatch, SetStateAction, createContext } from 'react';
import { TAnswer, TQuestion } from '../types';

export type TQuestionnaireContext = {
  currentQuestion: TQuestion | null;
  setNextQuestion: (questions: TQuestion[]) => void;

  answers: TAnswer[];
  setAnswers: Dispatch<SetStateAction<TAnswer[]>>;
};

export const QuestionnaireContext = createContext<
  TQuestionnaireContext | undefined
>(undefined);
