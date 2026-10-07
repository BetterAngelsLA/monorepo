import type { Meta, StoryObj } from '@storybook/react';
import { SurveyCheckbox } from '../../../pages/introduction/firesSurvey/components/SurveyCheckbox';
import { surveyConfig } from '../../../pages/introduction/firesSurvey/config/config';
import { Survey } from './Survey';
import SurveyProvider from './provider/SurveyProvider';
import { TSurveyForm } from './types';

const forms: TSurveyForm[] = [
  {
    id: 'interests',
    title: 'Your interests',
    nextFormId: 'details',
    questions: [
      {
        id: 'topics',
        title: 'What would you like help with?',
        type: 'checkbox',
        rules: { required: true },
        options: [
          { optionId: 'housing', label: 'Housing' },
          { optionId: 'work', label: 'Employment' },
        ],
      },
    ],
  },
  {
    id: 'details',
    title: 'Housing details',
    nextFormId: null,
    showConditions: {
      type: 'all',
      rules: [
        { type: 'answerIncludes', questionId: 'topics', value: 'housing' },
      ],
    },
    questions: [
      {
        id: 'tenure',
        title: 'Do you rent or own?',
        type: 'radio',
        rules: { required: true },
        options: [
          { optionId: 'rent', label: 'Rent' },
          { optionId: 'own', label: 'Own' },
        ],
      },
    ],
  },
];

const meta = {
  title: 'Survey',
  component: Survey,
  parameters: { layout: 'padded' },
  render: (args) => (
    <SurveyProvider surveyForms={forms}>
      <Survey {...args} />
    </SurveyProvider>
  ),
} satisfies Meta<typeof Survey>;
export default meta;
type Story = StoryObj<typeof meta>;

/** Select Housing to visit the conditional form; Employment skips it. */
export const ConditionalFlow: Story = {};
export const OptionalQuestion: Story = {
  render: (args) => (
    <SurveyProvider
      surveyForms={[
        {
          ...forms[1],
          showConditions: undefined,
          questions: forms[1].questions.map((question) => ({
            ...question,
            rules: undefined,
          })),
        },
      ]}
    >
      <Survey {...args} />
    </SurveyProvider>
  ),
};
export const Wildfires: Story = {
  render: (args) => (
    <SurveyProvider
      surveyForms={surveyConfig}
      ui={{ Checkbox: SurveyCheckbox }}
    >
      <Survey {...args} />
    </SurveyProvider>
  ),
};
