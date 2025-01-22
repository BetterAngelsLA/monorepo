import { TSurvey } from '../../../../shared/components/survey/types';
import { documentationForm } from './documentation';
import { housingFormsNested } from './housing';
import { incomeForm } from './income';
import { introductionForm } from './introduction';

export const surveyConfig: TSurvey = [
  { ...introductionForm, next: { default: 'documentationForm' } },
  { ...documentationForm, next: { default: 'incomeForm' } },
  { ...incomeForm, next: { default: 'tempHousingForm' } },
  ...housingFormsNested,
];
