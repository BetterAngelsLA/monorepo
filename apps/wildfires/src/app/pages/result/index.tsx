import { useAtom } from 'jotai';
import { surveyResultsAtom } from '../../shared/atoms/surveyResultsAtom';
import { SurveyResults } from '../../shared/components/surveyResults/SurveyResults';

export default function Result() {
  const [surveyResults] = useAtom(surveyResultsAtom);

  return (
    <>
      {/* <HorizontalLayout className="bg-brand-dark-blue">
        <Hero className="min-h-[60vh] py-14 md:py-28">
          <h1 className="font-light border-l-[10px] pl-4 md:pl-8 border-brand-yellow text-5xl text-white md:text-[74px] md:leading-[96.2px]">
            Thank you for helping us understand your situation. Here is a
            personalized action plan for you.
          </h1>
        </Hero>
      </HorizontalLayout>
      <HorizontalLayout>
        <BestPractices />
      </HorizontalLayout>
      <HorizontalLayout>
        <ImportantTips />
      </HorizontalLayout>
      <Register /> */}
      {!!surveyResults && (
        <SurveyResults className="mt-8 mb-24" results={surveyResults} />
      )}
    </>
  );
}
