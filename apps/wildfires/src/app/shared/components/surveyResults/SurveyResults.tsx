import { useQuery } from '@tanstack/react-query';

import { useSearchParams } from 'react-router-dom';
import { surveyConfig } from '../../../pages/introduction/firesSurvey/config/config';
import { fetchAllAlertsAndResourcesByTagsFn } from '../../clients/sanityCms/queries/fetchAllAlertsAndResourcesByTagsFn';
import { mergeCss } from '../../utils/styles/mergeCss';
import { TAnswer, TOption, TSurveyResults } from '../survey/types';
import { getAllQuestions } from '../survey/utils/validateConfig';
import { SurveyResources } from '../surveyResources/SurveyResources';

const allQestions = getAllQuestions(surveyConfig);

function findQuestionById(id: string) {
  return allQestions.find((q) => q.id === id);
}

function getAnswerTags(answer: TAnswer, answerOptions: TOption[]): string[] {
  const answerTags: string[] = [];

  let results = answer.result;

  if (typeof results === 'string') {
    results = [results];
  }

  for (const result of results) {
    const resultOption = answerOptions.find((o) => o.optionId === result);

    if (!resultOption) {
      continue;
    }

    const optionTags = resultOption.tags || [];

    for (const tag of optionTags) {
      answerTags.push(tag);
    }
  }

  return answerTags;
}

function getTagsFromAnswers(answers: TAnswer[]): string[] {
  const tags: string[] = [];

  for (const answer of answers) {
    const questionAnswered = findQuestionById(answer.questionId);

    if (!questionAnswered?.options) {
      continue;
    }

    const answerTags = getAnswerTags(answer, questionAnswered?.options);

    for (const answerTag of answerTags) {
      tags.push(answerTag);
    }
  }

  return tags;
}

function getTags(answers: TAnswer[], tagsStr?: string | null): string[] {
  if (answers.length) {
    return getTagsFromAnswers(answers);
  }

  if (!tagsStr) {
    return [];
  }

  return tagsStr.split(',');
}

type ISurveyResults = {
  className?: string;
  results?: TSurveyResults;
};

export function SurveyResults(props: ISurveyResults) {
  const { results, className } = props;

  const [searchParams] = useSearchParams();

  const resultData = results || {
    answers: [],
  };

  const { answers } = resultData;

  const resourceTags = getTags(answers, searchParams.get('tags'));

  const { isLoading, isError, data, error } = useQuery({
    queryKey: resourceTags,
    queryFn: () => fetchAllAlertsAndResourcesByTagsFn(resourceTags),
    refetchOnWindowFocus: false,
    retry: 1,
  });

  const parentCss = [className];

  return (
    <div className={mergeCss(parentCss)}>
      {!!data?.length && <SurveyResources resources={data} />}
    </div>
  );
}
