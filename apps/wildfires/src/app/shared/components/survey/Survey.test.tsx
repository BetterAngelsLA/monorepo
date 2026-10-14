import { StrictMode, useContext } from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Survey } from './Survey';
import { SurveyContext } from './provider/SurveyContext';
import SurveyProvider from './provider/SurveyProvider';
import { ICheckboxProps } from '../form/Checkbox';
import { TSurveyForm } from './types';

const forms: TSurveyForm[] = [
  {
    id: 'first',
    title: 'First',
    nextFormId: 'second',
    questions: [
      {
        id: 'choice',
        title: 'Choose a path',
        type: 'radio',
        rules: { required: true },
        options: [
          { optionId: 'yes', label: 'Yes' },
          { optionId: 'no', label: 'No' },
        ],
      },
    ],
  },
  {
    id: 'second',
    title: 'Second',
    nextFormId: 'third',
    showConditions: {
      type: 'all',
      rules: [{ type: 'answerEquals', questionId: 'choice', value: 'yes' }],
    },
    questions: [
      {
        id: 'details',
        title: 'Choose details',
        type: 'checkbox',
        rules: { required: true },
        options: [
          { optionId: 'a', label: 'A' },
          { optionId: 'b', label: 'B' },
        ],
      },
    ],
  },
  {
    id: 'third',
    title: 'Third',
    nextFormId: null,
    showConditions: {
      type: 'all',
      rules: [{ type: 'answerExists', questionId: 'details' }],
    },
    questions: [],
  },
];

function TestCheckbox({ label, checked = false, onChange }: ICheckboxProps) {
  return (
    <label>
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
      />
      {label}
    </label>
  );
}
const ui = { Checkbox: TestCheckbox };
const continueButton = () =>
  screen.getByRole('button', { name: 'questionnaire continue button' });
const next = () => fireEvent.click(continueButton());
const back = () =>
  fireEvent.click(
    screen.getByRole('button', { name: 'questionnaire back button' }),
  );
afterEach(cleanup);

describe('Survey', () => {
  it('validates selections, preserves answers on back navigation, and completes once in StrictMode', () => {
    const onEnd = vi.fn();
    const onBack = vi.fn();
    const onRender = vi.fn();
    render(
      <StrictMode>
        <SurveyProvider
          surveyForms={forms}
          ui={ui}
          onSurveyEnd={onEnd}
          onFormBack={onBack}
          onFormRender={onRender}
        >
          <Survey />
        </SurveyProvider>
      </StrictMode>,
    );
    expect(
      screen.queryByRole('button', { name: 'questionnaire back button' }),
    ).toBeNull();
    expect(continueButton().hasAttribute('disabled')).toBe(true);
    fireEvent.click(screen.getByRole('radio', { name: 'Yes' }));
    next();
    expect(continueButton().hasAttribute('disabled')).toBe(true);
    fireEvent.click(screen.getByRole('checkbox', { name: 'A' }));
    fireEvent.click(screen.getByRole('checkbox', { name: 'A' }));
    expect(continueButton().hasAttribute('disabled')).toBe(true);
    fireEvent.click(screen.getByRole('checkbox', { name: 'B' }));
    back();
    expect(
      (screen.getByRole('radio', { name: 'Yes' }) as HTMLInputElement).checked,
    ).toBe(true);
    next();
    expect(
      (screen.getByRole('checkbox', { name: 'B' }) as HTMLInputElement).checked,
    ).toBe(true);
    next();
    next();
    expect(screen.getByText('Results')).toBeTruthy();
    expect(onEnd).toHaveBeenCalledExactlyOnceWith({
      answers: [
        { questionId: 'choice', result: 'yes' },
        { questionId: 'details', result: ['b'] },
      ],
    });
    expect(onBack).toHaveBeenCalledTimes(1);
    expect(onRender).toHaveBeenCalledTimes(3);
  });

  it('discards hidden answers before evaluating dependent conditions after a path changes', () => {
    const onEnd = vi.fn();
    render(
      <SurveyProvider surveyForms={forms} ui={ui} onSurveyEnd={onEnd}>
        <Survey />
      </SurveyProvider>,
    );
    fireEvent.click(screen.getByRole('radio', { name: 'Yes' }));
    next();
    fireEvent.click(screen.getByRole('checkbox', { name: 'A' }));
    next();
    back();
    back();
    fireEvent.click(screen.getByRole('radio', { name: 'No' }));
    next();
    expect(onEnd).toHaveBeenCalledExactlyOnceWith({
      answers: [{ questionId: 'choice', result: 'no' }],
    });
    expect(screen.getByText('Results')).toBeTruthy();
  });

  it('uses the latest onChange without notifying when only the callback identity changes', () => {
    const first = vi.fn();
    const latest = vi.fn();
    const view = render(
      <SurveyProvider surveyForms={forms}>
        <Survey onChange={first} />
      </SurveyProvider>,
    );
    expect(first).toHaveBeenCalledExactlyOnceWith([]);
    view.rerender(
      <SurveyProvider surveyForms={forms}>
        <Survey onChange={latest} />
      </SurveyProvider>,
    );
    expect(latest).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('radio', { name: 'Yes' }));
    expect(latest).toHaveBeenCalledExactlyOnceWith([
      { questionId: 'choice', result: 'yes' },
    ]);
    next();
    expect(latest).toHaveBeenCalledTimes(1);
  });

  it('groups radio options by question and keeps separate survey instances independent', () => {
    render(
      <>
        <SurveyProvider surveyForms={forms}>
          <Survey />
        </SurveyProvider>
        <SurveyProvider surveyForms={forms}>
          <Survey />
        </SurveyProvider>
      </>,
    );
    const radios = screen.getAllByRole('radio') as HTMLInputElement[];
    expect(radios[0].name).toBe(radios[1].name);
    expect(radios[0].name).not.toBe(radios[2].name);
    expect(radios.slice(0, 2).map((radio) => radio.value)).toEqual([
      'yes',
      'no',
    ]);
  });

  it('does not emit a back event at the first form', () => {
    const onBack = vi.fn();
    render(
      <SurveyProvider surveyForms={forms} onFormBack={onBack}>
        <BackControl />
      </SurveyProvider>,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Try back' }));
    expect(onBack).not.toHaveBeenCalled();
  });

  it('allows optional questions to remain unanswered', () => {
    const onEnd = vi.fn();
    const optional: TSurveyForm[] = [
      {
        ...forms[0],
        nextFormId: null,
        questions: forms[0].questions.map((question) => ({
          ...question,
          rules: undefined,
        })),
      },
    ];
    render(
      <SurveyProvider surveyForms={optional} onSurveyEnd={onEnd}>
        <Survey />
      </SurveyProvider>,
    );
    next();
    expect(onEnd).toHaveBeenCalledExactlyOnceWith({ answers: [] });
  });
});

function BackControl() {
  const context = useContext(SurveyContext);
  return (
    <button type="button" onClick={context?.goBack}>
      Try back
    </button>
  );
}
