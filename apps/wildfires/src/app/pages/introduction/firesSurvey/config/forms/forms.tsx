import { TSurveyForm } from '../../../../../shared/components/survey/types';
import { qDocumentReplacement } from './questions/documentReplacement';
import { qEmploymentType } from './questions/employmentType';
import { qHaveOwnersInsurance } from './questions/haveOwnersInsurance';
import { qHaveRentersInsurance } from './questions/haveRentersInsurance';
import { qIncomeAssessment } from './questions/incomeAssessment';
import { qIsSmallBusiness } from './questions/isSmallBusiness';
import { qTempHousing } from './questions/needTempHousing';
import { qRentOrOwn } from './questions/rentOrOwn';
import { qResourceTopics } from './questions/resourceTopics';
import { qWhichFire } from './questions/whichFire';

export const introductionForm: TSurveyForm = {
  id: 'introductionForm',
  title: 'Introduction',
  nextFormId: 'documentReplacementForm',
  questions: [qWhichFire, qResourceTopics],
};

export const documentReplacementForm: TSurveyForm = {
  id: 'documentReplacementForm',
  title: 'Documentation',
  nextFormId: 'incomeAssessmentForm',
  questions: [qDocumentReplacement],
  showConditions: {
    type: 'all',
    rules: [
      {
        questionId: 'qResourceTopics',
        type: 'answerIncludes',
        value: 'resourceDocumentReplacement',
      },
    ],
  },
};

export const incomeAssessmentForm: TSurveyForm = {
  id: 'incomeAssessmentForm',
  title: 'Income',
  nextFormId: 'employmentTypeForm',
  questions: [qIncomeAssessment],
  showConditions: {
    type: 'all',
    rules: [
      {
        questionId: 'qResourceTopics',
        type: 'answerIncludes',
        value: 'resourceFinancial',
      },
    ],
  },
};

export const employmentTypeForm: TSurveyForm = {
  id: 'employmentTypeForm',
  title: 'Employment',
  nextFormId: 'tempHousingForm',
  questions: [qEmploymentType],
  showConditions: {
    type: 'all',
    rules: [
      {
        questionId: 'qIncomeAssessment',
        type: 'answerExists',
      },
    ],
  },
};

export const tempHousingForm: TSurveyForm = {
  id: 'tempHousingForm',
  title: 'Housing',
  nextFormId: 'rentOrOwnFormForm',
  questions: [qTempHousing],
  showConditions: {
    type: 'all',
    rules: [
      {
        questionId: 'qResourceTopics',
        type: 'answerIncludes',
        value: 'resourceHousing',
      },
    ],
  },
};

export const rentOrOwnFormForm: TSurveyForm = {
  id: 'rentOrOwnFormForm',
  title: 'Housing',
  nextFormId: 'haveOwnersInsuranceForm',
  questions: [qRentOrOwn],
  showConditions: {
    type: 'all',
    rules: [
      {
        questionId: 'qTempHousing',
        type: 'answerExists',
      },
    ],
  },
};

export const haveOwnersInsuranceForm: TSurveyForm = {
  id: 'haveOwnersInsuranceForm',
  title: 'Housing',
  nextFormId: 'haveRentersInsuranceForm',
  questions: [qHaveOwnersInsurance],
  showConditions: {
    type: 'all',
    rules: [
      {
        questionId: 'qRentOrOwn',
        type: 'answerEquals',
        value: 'own',
      },
    ],
  },
};

export const haveRentersInsuranceForm: TSurveyForm = {
  id: 'haveRentersInsuranceForm',
  title: 'Renters Insurance Form',
  nextFormId: 'isSmallBusinessForm',
  questions: [qHaveRentersInsurance],
  showConditions: {
    type: 'all',
    rules: [
      {
        questionId: 'qRentOrOwn',
        type: 'answerEquals',
        value: 'rent',
      },
    ],
  },
};

export const isSmallBusinessForm: TSurveyForm = {
  id: 'isSmallBusinessForm',
  title: 'Business',
  nextFormId: null,
  questions: [qIsSmallBusiness],
  showConditions: {
    type: 'all',
    rules: [
      {
        questionId: 'qResourceTopics',
        type: 'answerIncludes',
        value: 'resourceBusiness',
      },
    ],
  },
};
