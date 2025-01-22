import { useContext } from 'react';
import { mergeCss } from '../../utils/styles/mergeCss';
import { SurveyContext } from './provider/SurveyContext';
import { QuestionHeader } from './shared/QuestionHeader';

type IProps = {
  className?: string;
};

export function Results(props: IProps) {
  const { className } = props;

  const context = useContext(SurveyContext);

  if (!context) {
    throw new Error('SurveyContext missing');
  }

  const { answers = [] } = context;

  const parentCss = [className];

  function answerToArr(answer: string | string[]) {
    if (typeof answer === 'string') {
      return [answer];
    }

    return answer || [];
  }

  return (
    <div className={mergeCss(parentCss)}>
      <QuestionHeader title="Results" className="mb-12" />

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
