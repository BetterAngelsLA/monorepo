import { mergeCss } from '../../utils/styles/mergeCss';
import { QuestionCard } from './QuestionCard';
import { TAnswer, TSection } from './types';

type IProps = {
  section: TSection;
  className?: string;
};

export function QuestionsBlock(props: IProps) {
  const { className, section } = props;

  const parentCss = [className];

  function handleAnswer(answer: TAnswer) {
    console.log();
    console.log('| -------------  answer  ------------- |');
    console.log(answer);
    console.log();
  }

  return (
    <div className={mergeCss(parentCss)}>
      <div className="mb-4">{section.title}</div>

      {section.questions.map((question) => {
        return (
          <QuestionCard
            key={question.id}
            className="mt-8"
            question={question}
            // answer={questionResult(question, answers)}
            onAnswer={handleAnswer}
          />
        );
      })}
    </div>
  );
}
