import { TAnswer, TConditionRule, TSurveyForm } from '../types';

export function matchesRule(rule: TConditionRule, answers: TAnswer[]): boolean {
  const result = answers.find(
    (answer) => answer.questionId === rule.questionId,
  )?.result;
  switch (rule.type) {
    case 'answerExists':
      return Array.isArray(result) ? result.length > 0 : !!result;
    case 'answerEquals':
      return result === rule.value;
    case 'answerIncludes':
      return Array.isArray(result) && result.includes(rule.value);
  }
}

/** Discard hidden answers in route order before evaluating dependent conditions. */
export function resolveRoute(forms: TSurveyForm[], answers: TAnswer[]) {
  const route: TSurveyForm[] = [];
  let activeAnswers = answers;
  let form: TSurveyForm | undefined = forms[0];
  const visited = new Set<string>();
  while (form && !visited.has(form.id)) {
    visited.add(form.id);
    const answersForConditions = activeAnswers;
    if (
      route.length === 0 ||
      !form.showConditions ||
      form.showConditions.rules.every((rule) =>
        matchesRule(rule, answersForConditions),
      )
    ) {
      route.push(form);
    } else {
      const questionIds = new Set(
        form.questions.map((question) => question.id),
      );
      activeAnswers = activeAnswers.filter(
        (answer) => !questionIds.has(answer.questionId),
      );
    }
    const nextId: string | null = form.nextFormId;
    form = forms.find((candidate) => candidate.id === nextId);
  }
  const activeQuestionIds = new Set(
    route.flatMap((item) => item.questions.map((question) => question.id)),
  );
  return {
    route,
    answers: activeAnswers.filter((answer) =>
      activeQuestionIds.has(answer.questionId),
    ),
  };
}
