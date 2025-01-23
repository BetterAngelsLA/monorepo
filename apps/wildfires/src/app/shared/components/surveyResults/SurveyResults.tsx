import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';

import { surveyConfig } from '../../../pages/introduction/firesSurvey/config/config';
import { fetchResourcesByTagsFn } from '../../clients/sanityCms/queries/fetchResourcesByTagsFn';
import { mergeCss } from '../../utils/styles/mergeCss';
import { TAnswer, TOption, TSurveyResults } from '../survey/types';
import { getAllQuestions } from '../survey/utils/validateConfig';

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

function getTags(answers: TAnswer[]): string[] {
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

type IProps = {
  className?: string;
  results: TSurveyResults;
};

export function SurveyResults(props: IProps) {
  const { results, className } = props;

  const surveryConf = surveyConfig;

  const { answers = [] } = results;

  const queryTags = getTags(answers);

  console.log('fetching by Tags ');
  console.log(queryTags);
  console.log();

  const { isLoading, isError, data, error } = useQuery({
    queryKey: queryTags,
    queryFn: () => fetchResourcesByTagsFn(queryTags),
    refetchOnWindowFocus: false,
    retry: 1,
  });

  useEffect(() => {
    console.log('returned resources by tags:');
    console.log(data?.result);
    console.log();
  }, [data]);

  const parentCss = [className];

  function answerToArr(answer: string | string[]) {
    if (typeof answer === 'string') {
      return [answer];
    }

    return answer || [];
  }

  return (
    <div className={mergeCss(parentCss)}>
      <div className="mt-4 mb-8 font-bold text-2xl">Survey Answers</div>

      {answers.map((answer) => {
        return (
          <div
            key={answer.questionId}
            className="mb-8 border-b-2 last:border-b-0"
          >
            <div>
              <div>Question Id: {answer.questionId}</div>
              <div className="mb-2 font-bold">Answer:</div>
              <div>{answerToArr(answer.result).join(', ')}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
