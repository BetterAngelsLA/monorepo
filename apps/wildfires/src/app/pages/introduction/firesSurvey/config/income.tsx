import { TFormBase } from 'apps/wildfires/src/app/shared/components/survey/types';

export const incomeForm: TFormBase = {
  id: 'incomeForm',
  title: 'Income',
  questions: [
    {
      id: 'incomeByHouseholdSize',
      type: 'radio',
      title:
        'Based on your household size, is your income LESS or GREATER than the number in this chart?',
      options: [
        {
          optionId: 'less',
          label: 'Less',
        },
        {
          optionId: 'more',
          label: 'Greater',
        },
      ],
      rules: {
        required: true,
      },
      renderAfter: (
        <div className="my-6 border-4 p-6 border-gray-500">
          table (component) with household data rendered here
        </div>
      ),
    },
    {
      id: 'employmentType',
      type: 'checkbox',
      title:
        'Are you employed by a company, or do you work for yourself as a freelancer or self-employed professional?',
      options: [
        {
          optionId: 'employmentCompany',
          label: 'Employed by a Company',
        },
        {
          optionId: 'employmentSelfEmployed',
          label: 'Self-Employed',
        },
        {
          optionId: 'employmentFreelance',
          label: 'Freelance worker',
        },
      ],
      rules: {
        required: true,
      },
    },
  ],
};
