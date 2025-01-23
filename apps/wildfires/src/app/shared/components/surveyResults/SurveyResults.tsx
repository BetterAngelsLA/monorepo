import { mergeCss } from '../../utils/styles/mergeCss';
import { TSurveyResults } from '../survey/types';

type IProps = {
  className?: string;
  results: TSurveyResults;
};

export function SurveyResults(props: IProps) {
  const { results, className } = props;

  const { answers = [] } = results;

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
