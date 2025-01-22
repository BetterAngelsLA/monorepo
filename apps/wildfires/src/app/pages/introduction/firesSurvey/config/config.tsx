import { TSurvey } from '../../../../shared/components/survey/types';
import {
  documentReplacementForm,
  employmentTypeForm,
  haveOwnersInsuranceForm,
  haveRentersInsuranceForm,
  incomeAssessmentForm,
  introductionForm,
  isSmallBusinessForm,
  rentOrOwnFormForm,
  tempHousingForm,
} from './forms/forms';

export const surveyConfig: TSurvey = [
  introductionForm,
  documentReplacementForm,
  incomeAssessmentForm,
  employmentTypeForm,
  tempHousingForm,
  rentOrOwnFormForm,
  haveOwnersInsuranceForm,
  haveRentersInsuranceForm,
  isSmallBusinessForm,
];
