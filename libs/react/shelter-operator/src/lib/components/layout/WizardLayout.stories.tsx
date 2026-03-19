import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { WizardLayout, type WizardLayoutProps } from './WizardLayout';

const meta: Meta<WizardLayoutProps> = {
  component: WizardLayout,
  title: 'Wizard/WizardLayout',
  parameters: {
    customLayout: {
      variant: 'basic',
      className: 'w-full px-8',
    },
  },
};
export default meta;

type Story = StoryObj<WizardLayoutProps>;

const defaultSteps = [
  { label: 'Add Profile' },
  { label: 'Select Shelter' },
  { label: 'Select Room or Bed' },
  { label: 'Confirmation' },
];

const defaultStepPaths = [
  '/reservation/profile',
  '/reservation/shelter',
  '/reservation/room',
  '/reservation/confirmation',
];

const withRouter = (initialPath: string) => ({
  decorators: [
    (Story: React.ComponentType) => (
      <MemoryRouter initialEntries={[initialPath]}>
        <Routes>
          <Route path="/reservation" element={<Story />}>
            <Route
              path="profile"
              element={<div className="p-4">Add Profile Step Content</div>}
            />
            <Route
              path="shelter"
              element={<div className="p-4">Select Shelter Step Content</div>}
            />
            <Route
              path="room"
              element={
                <div className="p-4">Select Room or Bed Step Content</div>
              }
            />
            <Route
              path="confirmation"
              element={<div className="p-4">Confirmation Step Content</div>}
            />
          </Route>
        </Routes>
      </MemoryRouter>
    ),
  ],
});

export const FirstStep: Story = {
  ...withRouter('/reservation/profile'),
  args: {
    steps: defaultSteps,
    stepPaths: defaultStepPaths,
  },
};

export const SecondStep: Story = {
  ...withRouter('/reservation/shelter'),
  args: {
    steps: defaultSteps,
    stepPaths: defaultStepPaths,
  },
};

export const ThirdStep: Story = {
  ...withRouter('/reservation/room'),
  args: {
    steps: defaultSteps,
    stepPaths: defaultStepPaths,
  },
};

export const LastStep: Story = {
  ...withRouter('/reservation/confirmation'),
  args: {
    steps: defaultSteps,
    stepPaths: defaultStepPaths,
  },
};

export const WithNavigation: Story = {
  ...withRouter('/reservation/shelter'),
  args: {
    steps: defaultSteps,
    stepPaths: defaultStepPaths,
    navigationConfig: {
      showNavigation: true,
    },
  },
};

export const WithNavigationFirstStep: Story = {
  ...withRouter('/reservation/profile'),
  args: {
    steps: defaultSteps,
    stepPaths: defaultStepPaths,
    navigationConfig: {
      showNavigation: true,
    },
  },
};

export const WithNavigationLastStep: Story = {
  ...withRouter('/reservation/confirmation'),
  args: {
    steps: defaultSteps,
    stepPaths: defaultStepPaths,
    navigationConfig: {
      showNavigation: true,
      nextLabel: 'Submit',
    },
  },
};

export const WithCustomHandlers: Story = {
  ...withRouter('/reservation/shelter'),
  args: {
    steps: defaultSteps,
    stepPaths: defaultStepPaths,
    navigationConfig: {
      showNavigation: true,
      onBack: () => alert('Custom back handler!'),
      onNext: () => alert('Custom next handler!'),
    },
  },
};

export const WithDisabledNext: Story = {
  ...withRouter('/reservation/room'),
  args: {
    steps: defaultSteps,
    stepPaths: defaultStepPaths,
    navigationConfig: {
      showNavigation: true,
      nextDisabled: true,
    },
  },
};

export const WithCustomLabels: Story = {
  ...withRouter('/reservation/shelter'),
  args: {
    steps: defaultSteps,
    stepPaths: defaultStepPaths,
    navigationConfig: {
      showNavigation: true,
      backLabel: 'Previous',
      nextLabel: 'Continue',
    },
  },
};
