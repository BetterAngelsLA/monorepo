import { TQuestion } from '../../../../../../shared/components/survey/types';

export const qIncomeAssessment: TQuestion = {
  id: 'qIncomeAssessment',
  type: 'radio',
  title:
    'Based on your household size, is your income LESS or GREATER than the number in this chart?',
  options: [
    {
      optionId: 'incomeLow',
      label: 'Less',
      // tags: ['Income - Low Income']
      // slugs: ['income-low-income']
    },
    {
      optionId: 'incomeHigh',
      label: 'Greater',
      // No tags / Slugs
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
};
