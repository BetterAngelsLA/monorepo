import { TQuestion } from '../../../../../../shared/components/survey/types';
import { Table } from '../../../../../../shared/components/table/Table';

function IncomeByHouseholdTable() {
  return (
    <div className="flex justify-center">
      <Table
        className="flex mb-12 md:mb-24 max-w-3xl"
        headers={[
          'Household Size',
          'Monthly Gross Income Limit (Simplified)',
          'Annualized',
        ]}
        values={[
          ['1', '$2,500', '$30,000'],
          ['2', '$3,400', '$40,800'],
          ['3', '$4,300', '$51,600'],
          ['4', '$5,200', '$62,400'],
          ['5', '$6,100', '$73,200'],
          ['6', '$7,000', '$84,000'],
          ['7', '$7,900', '$94,000'],
          ['8', '$8,800', '$105,600'],
          ['Each add’l person', '+$900', '+$10,800'],
        ]}
      />
    </div>
  );
}

export const qIncomeAssessment: TQuestion = {
  id: 'qIncomeAssessment',
  type: 'radio',
  title:
    'Based on your household size, is your income LESS or GREATER than the number in this chart?',
  subtitle:
    'Please see the chart below and tell us if, for the number of people in your household, your household’s total pre-tax income (before the fires) was less or greater than the income amount listed in that row of the chart.',
  options: [
    {
      optionId: 'incomeLow',
      label: 'Less',
      // tags: ['Income - Low Income']
      tags: ['income-low-income'],
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
  renderIn: <IncomeByHouseholdTable />,
};
