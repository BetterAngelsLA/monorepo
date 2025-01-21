import {
  TFormBase,
  TFormConditional,
  TSurveyForm,
} from 'apps/wildfires/src/app/shared/components/survey/types';

const SECTION_TITLE = 'Housing';

const tempHousingForm: TFormBase = {
  id: 'tempHousingForm',
  title: SECTION_TITLE,
  next: {
    default: 'rentOrOwnForm',
  },
  questions: [
    {
      id: 'needTempHousing',
      type: 'radio',
      question: 'Do you need a temporary housing?',
      options: [
        {
          optionId: 'yes',
          label: 'Yes',
        },
        {
          optionId: 'no',
          label: 'No',
        },
      ],
      rules: {
        required: true,
      },
    },
  ],
};

const rentOrOwnForm: TFormConditional = {
  id: 'rentOrOwnForm',
  conditional: true,
  title: SECTION_TITLE,
  next: {
    conditional: {
      rent: 'rentersInsuranceForm',
      own: 'ownersInsuranceForm',
    },
  },
  questions: [
    {
      id: 'rentOrOwn',
      type: 'radio',
      question: 'Do you RENT or OWN your home?',
      options: [
        {
          optionId: 'rent',
          label: 'Rent',
        },
        {
          optionId: 'own',
          label: 'Own',
        },
      ],
      rules: {
        required: true,
      },
    },
  ],
};

const rentersInsuranceForm: TFormBase = {
  id: 'rentersInsuranceForm',
  title: SECTION_TITLE,
  // next: {
  // //   default: 'rentOrOwnForm',
  // },
  questions: [
    {
      id: 'haveRentersInsurance',
      type: 'radio',
      question: 'Do you have Renter’s Insurance? ',
      options: [
        {
          optionId: 'yes',
          label: 'Yes',
        },
        {
          optionId: 'no',
          label: 'No',
        },
      ],
      rules: {
        required: true,
      },
    },
  ],
};

const ownersInsuranceForm: TFormBase = {
  id: 'ownersInsuranceForm',
  title: SECTION_TITLE,
  // next: {
  // //   default: 'rentOrOwnForm',
  // },
  questions: [
    {
      id: 'haveOwnersInsurance',
      type: 'radio',
      question: 'Do you have Owner’s Insurance? ',
      options: [
        {
          optionId: 'yes',
          label: 'Yes',
        },
        {
          optionId: 'no',
          label: 'No',
        },
      ],
      rules: {
        required: true,
      },
    },
  ],
};

export const housingFormsNested: TSurveyForm[] = [
  tempHousingForm,
  rentOrOwnForm,
  rentersInsuranceForm,
  ownersInsuranceForm,
];
