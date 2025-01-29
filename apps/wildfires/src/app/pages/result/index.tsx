import { useAtom } from 'jotai';
import { HorizontalLayout } from '../../layout/horizontalLayout';
import { surveyResultsAtom } from '../../shared/atoms/surveyResultsAtom';
import BestPractices from '../../shared/components/bestPractices/BestPractices';
import Hero from '../../shared/components/hero/Hero';
import Partners from '../../shared/components/partners/Partners';
import Register from '../../shared/components/register/Register';
import ResultsPdfButton from '../../shared/components/resultsPdf/resultsPdfButton';
import { SurveyResults } from '../../shared/components/surveyResults/SurveyResults';
import { useAnswerTags } from '../../shared/hooks/useAnswerTags';

export default function ResultPage() {
  const [surveyResults] = useAtom(surveyResultsAtom);

  const resultsData = surveyResults || {
    answers: [],
  };

  const { answers } = resultsData;

  const answerTags = useAnswerTags(answers);

  // useSurveySubmission(surveyResults || null);

  return (
    <>
      <HorizontalLayout className="bg-brand-dark-blue">
        <Hero className="min-h-[60vh] py-14 md:py-28">
          <h1 className="font-light border-l-[10px] pl-4 md:pl-8 border-brand-yellow text-5xl text-white md:text-[64px] md:leading-[1.2]">
            Your Wildfire Recovery Action Plan
          </h1>
        </Hero>
      </HorizontalLayout>
      <HorizontalLayout>
        <BestPractices />

        {surveyResults && (
          <SurveyResults className="mt-8 mb-24" answerTags={answerTags} />
        )}

        <ResultsPdfButton
          tags={answerTags.join(',')}
          className="mb-16 md:mb-28 bg-brand-dark-blue text-white mx-auto"
        />
      </HorizontalLayout>
      <Register className="mt-12" />
      <HorizontalLayout className="bg-brand-sky-blue">
        <Partners />
      </HorizontalLayout>
    </>
  );
}
