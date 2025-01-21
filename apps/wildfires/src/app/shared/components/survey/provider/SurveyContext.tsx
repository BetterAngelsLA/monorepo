import { Dispatch, ElementType, SetStateAction, createContext } from 'react';
import { ICheckboxProps } from '../../form/Checkbox';
import { TAnswer, TSurveyForm } from '../types';

export type TSurveyUi = {
  Checkbox?: ElementType<ICheckboxProps>;
};

type TSurveyContext = {
  forms: TSurveyForm[];
  currentForm: TSurveyForm;
  formHistory: TSurveyForm[];
  answers: TAnswer[];

  setNextForm: () => void;
  setAnswers: Dispatch<SetStateAction<TAnswer[]>>;
  goBack: () => void;
  validateCurrentForm: () => string[];

  ui?: TSurveyUi;
};

export const SurveyContext = createContext<TSurveyContext | undefined>(
  undefined
);
