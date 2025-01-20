import { Dispatch, SetStateAction, createContext } from 'react';
import { TQuestion } from '../types';

export type TQuestionnaireContext = {
  currentQuestion: TQuestion | null;
  setCurrentQuestion: Dispatch<SetStateAction<TQuestion | null>>;
};

export const QuestionnaireContext = createContext<
  TQuestionnaireContext | undefined
>(undefined);
