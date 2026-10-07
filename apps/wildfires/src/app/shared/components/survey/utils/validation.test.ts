import { describe, expect, it } from 'vitest';
import { surveyConfig } from '../../../../pages/introduction/firesSurvey/config/config';
import { TAnswer, TQuestion, TSurveyForm } from '../types';
import { validateConfig } from './validateConfig';
import { validateForm } from './validateForm';

const question: TQuestion = {
  id: 'q',
  type: 'radio',
  title: 'Question',
  options: [{ optionId: 'a', label: 'A' }],
  rules: { required: true },
};
const form: TSurveyForm = {
  id: 'f',
  title: 'Form',
  questions: [question],
  nextFormId: null,
};
const invalidConfigs: { name: string; forms: TSurveyForm[] }[] = [
  { name: 'empty survey', forms: [] },
  { name: 'duplicate form IDs', forms: [form, form] },
  { name: 'missing form ID', forms: [{ ...form, id: '' }] },
  { name: 'unknown next form', forms: [{ ...form, nextFormId: 'missing' }] },
  { name: 'self-cycle', forms: [{ ...form, nextFormId: 'f' }] },
  {
    name: 'multi-form cycle',
    forms: [
      { ...form, nextFormId: 'g' },
      { id: 'g', title: 'G', questions: [], nextFormId: 'f' },
    ],
  },
  {
    name: 'duplicate question IDs',
    forms: [{ ...form, questions: [question, question] }],
  },
  {
    name: 'missing question ID',
    forms: [{ ...form, questions: [{ ...question, id: '' }] }],
  },
  {
    name: 'empty options',
    forms: [{ ...form, questions: [{ ...question, options: [] }] }],
  },
  {
    name: 'duplicate option IDs',
    forms: [
      {
        ...form,
        questions: [
          { ...question, options: [...question.options, ...question.options] },
        ],
      },
    ],
  },
  {
    name: 'unknown condition question',
    forms: [
      {
        ...form,
        showConditions: {
          type: 'all',
          rules: [{ type: 'answerExists', questionId: 'missing' }],
        },
      },
    ],
  },
];

describe('survey validation', () => {
  it.each(invalidConfigs)('rejects $name', ({ forms }) => {
    expect(validateConfig(forms).length).toBeGreaterThan(0);
  });
  it('accepts the Wildfires configuration', () =>
    expect(validateConfig(surveyConfig)).toEqual([]));
  it('accepts a valid one-form survey', () =>
    expect(validateConfig([form])).toEqual([]));

  const invalidAnswers: { result: TAnswer['result'] | undefined }[] = [
    undefined,
    '',
    [],
    ['a'],
    'unknown',
  ].map((result) => ({ result }));
  it.each(invalidAnswers)(
    'rejects invalid required radio answer $result',
    ({ result }) => {
      expect(
        validateForm({
          questions: [question],
          answers: result === undefined ? [] : [{ questionId: 'q', result }],
        }),
      ).toHaveLength(1);
    },
  );
  it('validates checkbox shape and option IDs for optional answers too', () => {
    const checkbox: TQuestion = {
      ...question,
      type: 'checkbox',
      rules: undefined,
    };
    for (const result of ['a', ['unknown']])
      expect(
        validateForm({
          questions: [checkbox],
          answers: [{ questionId: 'q', result }],
        }),
      ).toHaveLength(1);
    expect(validateForm({ questions: [checkbox], answers: [] })).toEqual([]);
    expect(
      validateForm({
        questions: [checkbox],
        answers: [{ questionId: 'q', result: ['a'] }],
      }),
    ).toEqual([]);
  });
});
