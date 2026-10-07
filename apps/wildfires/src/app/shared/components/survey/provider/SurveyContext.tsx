import {
  Dispatch,
  ComponentType,
  SetStateAction,
  createContext,
  useContext,
} from 'react';
import { ICheckboxProps } from '../../form/Checkbox';
import { TAnswer, TSurveyForm } from '../types';

export type TSurveyUi = {
  Checkbox?: ComponentType<ICheckboxProps>;
};

type TSurveyContext = {
  forms: TSurveyForm[];
  currentForm: TSurveyForm | null;
  formHistory: TSurveyForm[];
  answers: TAnswer[];

  setNextForm: () => void;
  setAnswers: Dispatch<SetStateAction<TAnswer[]>>;
  goBack: () => void;
  validateCurrentForm: () => string[];

  ui?: TSurveyUi;
};

export const SurveyContext = createContext<TSurveyContext | undefined>(
  undefined,
);

export function useSurvey() {
  const context = useContext(SurveyContext);
  if (!context) {
    throw new Error('Survey components must be used within a SurveyProvider');
  }
  return context;
}
