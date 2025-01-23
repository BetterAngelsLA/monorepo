import { TQuestion } from '../../../../../../shared/components/survey/types';
import { Table } from '../../../../../../shared/components/table/Table';

function IncomeByHouseholdTable() {
  return (
    <div className="flex justify-center">
      <Table
        className="flex mt-12 md:mt-24 max-w-3xl"
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
  renderAfter: <IncomeByHouseholdTable />,
};
