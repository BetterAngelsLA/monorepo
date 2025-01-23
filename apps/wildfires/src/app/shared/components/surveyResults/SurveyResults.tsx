import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import { mergeCss } from '../../utils/styles/mergeCss';
import { TSurveyResults } from '../survey/types';

type IProps = {
  className?: string;
  results: TSurveyResults;
};

const DEMO_QUERY_URL =
  'https://4v490tec.api.sanity.io/v2022-03-07/data/query/production?query=*%5B_type+%3D%3D+%22resource%22+%26%26+references%28*%5B_type+%3D%3D+%22resource-tag%22+%26%26+slug.current+%3D%3D+%22document-replacement-income-tax%22%5D._id%29%5D%7B%0A++title%2C%0A++resourceType%2C%0A++%22shortDescription%22%3A+shortDescription%5B%5D.children%5B%5D%7B%0A++++_type%2C%0A++++marks%2C%0A++++text%0A++%7D%2C%0A++%22description%22%3A+description%5B%5D.children%5B%5D%7B%0A++++_type%2C%0A++++marks%2C%0A++++text%0A++%7D%2C++++%0A++%22slug%22%3A+slug.current%2C%0A++resourceLink%2C%0A++priority%0A%7D&perspective=published';

export function SurveyResults(props: IProps) {
  const { results, className } = props;

  const { answers = [] } = results;

  const fetchResources = async () => {
    const response = await fetch(DEMO_QUERY_URL);

    return response.json();
  };

  console.log();
  console.log('| -------------  SurveyResults  ------------- |');
  console.log(answers);
  console.log();

  const { isLoading, isError, data, error } = useQuery({
    queryKey: ['resourcesByTags'],
    queryFn: fetchResources,
  });

  useEffect(() => {
    console.log();
    console.log('| -------------  SANITY data  ------------- |');
    console.log(data);
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
