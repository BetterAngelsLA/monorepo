import { HorizontalLayout } from '../../layout/horizontalLayout';
import BestPractices from '../../shared/components/bestPractices/BestPractices';
import { SurveyResults } from '../../shared/components/surveyResults/SurveyResults';

export default function ResultPdfpage() {
  return (
    <HorizontalLayout className="">
      <BestPractices expanded={true} />

      <SurveyResults className="mt-8 mb-24" />
    </HorizontalLayout>
  );
}
