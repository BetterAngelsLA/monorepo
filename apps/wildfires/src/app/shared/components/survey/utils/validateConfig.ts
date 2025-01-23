import { TConditionRule, TQuestion, TSurveyForm } from '../types';

function findDuplicates(arr: string[]): string[] {
  const seen = new Set<string>();
  const duplicates = new Set<string>();

  for (const item of arr) {
    if (seen.has(item)) {
      duplicates.add(item);
    } else {
      seen.add(item);
    }
  }

  return Array.from(duplicates);
}

export function getAllQuestions(forms: TSurveyForm[]): TQuestion[] {
  const questions: TQuestion[] = [];

  forms.forEach((form) => {
    form.questions.forEach((q) => {
      questions.push(q);
    });
  });

  return questions;
}

function validateQuestions(questions: TQuestion[]): string[] {
  const allHaveIds = questions.every((q) => !!q.id);

  if (!allHaveIds) {
    return ['some questions have missing Id.'];
  }

  const questionIds = questions.map((q) => q.id);

  const duplicateIds = findDuplicates(questionIds);

  if (duplicateIds.length) {
    return [`duplicate question Ids: [${duplicateIds.join(', ')}]`];
  }

  return [];
}

function validateNextFormIds(forms: TSurveyForm[]): string[] {
  const invalidFormIds: string[] = [];

  const formIds = forms.map((f) => f.id);

  forms.forEach((form) => {
    const nextId = form.nextFormId;

    if (nextId === null) {
      return;
    }

    const idExists = formIds.includes(nextId);

    if (!idExists) {
      invalidFormIds.push(nextId);
    }
  });

  return invalidFormIds;
}

function getAllRules(forms: TSurveyForm[]): TConditionRule[] {
  const rules: TConditionRule[] = [];

  forms.forEach((form) => {
    const showConditions = form.showConditions;
    if (showConditions) {
      showConditions.rules.forEach((rule) => {
        rules.push(rule);
      });
    }
  });

  return rules;
}

function validateConditions(forms: TSurveyForm[]): string[] {
  const withInvalidConditions: string[] = [];

  const allQuestions = getAllQuestions(forms);

  const questionIds = allQuestions.map((i) => i.id);

  for (const form of forms) {
    const showConditions = form.showConditions;

    if (showConditions) {
      showConditions.rules.forEach((rule) => {
        const validQuestionId = questionIds.includes(rule.questionId);

        if (!validQuestionId) {
          withInvalidConditions.push(form.id);
        }
      });
    }
  }

  if (withInvalidConditions.length) {
    return [
      `form IDs with invalid questionId in rules: [${withInvalidConditions.join(
        ', '
      )}]`,
    ];
  }

  return [];
}

export function validateConfig(forms: TSurveyForm[]): string[] {
  if (!forms || !forms.length) {
    return ['survey config errors: forms required.'];
  }

  const allFormsHaveIds = forms.every((f) => !!f.id);

  if (!allFormsHaveIds) {
    return ['survey config errors: some forms have missing Id.'];
  }

  const formIds = forms.map((f) => f.id);

  const duplicateFormIds = findDuplicates(formIds);

  if (duplicateFormIds.length) {
    return [
      `survey config errors: duplicate formIds: [${duplicateFormIds.join(
        ', '
      )}]`,
    ];
  }

  const allQuestions = getAllQuestions(forms);

  const questionErrors = validateQuestions(allQuestions);

  if (questionErrors.length) {
    return [`survey config errors: [${questionErrors.join(', ')}]`];
  }

  const invalidFormIds = validateNextFormIds(forms);

  if (invalidFormIds.length) {
    return [
      `survey config errors: invalid nextFormIds: [${invalidFormIds.join(
        ', '
      )}]`,
    ];
  }

  const conditionErrors = validateConditions(forms);

  if (conditionErrors.length) {
    return [`survey config errors: [${conditionErrors.join(', ')}]`];
  }

  return [];
}
