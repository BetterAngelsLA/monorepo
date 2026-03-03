import type { Meta, StoryObj } from '@storybook/react';
import {
  WizardProgressBar,
  type WizardProgressBarProps,
} from './WizardProgressBar';

const meta: Meta<WizardProgressBarProps> = {
  component: WizardProgressBar,
  title: 'Wizard/WizardProgressBar',
};
export default meta;

type Story = StoryObj<WizardProgressBarProps>;

const defaultSteps = [
  { label: 'Add Profile' },
  { label: 'Select Shelter' },
  { label: 'Select Room or Bed' },
  { label: 'Confirmation' },
];

const defaultSteps2 = [
  { label: 'Add Profile' },
  { label: 'Select Shelter' },
  { label: 'Select Room or Bed' },
  { label: 'Confirmation' },
];

export const FirstStep: Story = {
  args: {
    steps: defaultSteps2,
    currentStep: 0,
  },
};

export const SecondStep: Story = {
  args: {
    steps: defaultSteps2,
    currentStep: 1,
  },
};

export const ThirdStep: Story = {
  args: {
    steps: defaultSteps,
    currentStep: 2,
  },
};

export const LastStep: Story = {
  args: {
    steps: defaultSteps,
    currentStep: 3,
  },
};

export const Completed: Story = {
  args: {
    steps: defaultSteps,
    currentStep: 4,
  },
};

export const ManySteps: Story = {
  args: {
    steps: [
      { label: '' },
      { label: '' },
      { label: '' },
      { label: '' },
      { label: '' },
      { label: '' },
      { label: '' },
      { label: '' },
    ],
    currentStep: 0,
  },
};

export const ManyStepsMiddle: Story = {
  args: {
    steps: [
      { label: '' },
      { label: '' },
      { label: '' },
      { label: '' },
      { label: '' },
      { label: '' },
      { label: '' },
      { label: '' },
    ],
    currentStep: 4,
  },
};
