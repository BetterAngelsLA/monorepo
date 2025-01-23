import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';

import { fetchResourcesByTagsFn } from '../../clients/sanityCms/queries/fetchResourcesByTagsFn';
import { mergeCss } from '../../utils/styles/mergeCss';
import { TSurveyResults } from '../survey/types';

type IProps = {
  className?: string;
  results: TSurveyResults;
};

export function SurveyResults(props: IProps) {
  const { results, className } = props;

  const { answers = [] } = results;

  const queryTags = [
    'document-replacement-other',
    'document-replacement-income-tax',
  ];

  const { isLoading, isError, data, error } = useQuery({
    queryKey: queryTags,
    queryFn: () => fetchResourcesByTagsFn(queryTags),
    retry: 1,
  });

  useEffect(() => {
    console.log();
    console.log('| -------------  SANITY data  ------------- |');
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
