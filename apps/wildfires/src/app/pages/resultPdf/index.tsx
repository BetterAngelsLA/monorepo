import { HorizontalLayout } from '../../layout/horizontalLayout';
import BestPractices from '../../shared/components/bestPractices/BestPractices';
import { SurveyResults } from '../../shared/components/surveyResults/SurveyResults';
import { useAnswerTags } from '../../shared/hooks/useAnswerTags';

export default function ResultPdfpage() {
  const answerTags = useAnswerTags();

  return (
    <HorizontalLayout className="">
      <BestPractices expanded={true} />

      <SurveyResults
        className="mt-8 mb-24"
        answerTags={answerTags}
        expanded={true}
      />
    </HorizontalLayout>
  );
}
