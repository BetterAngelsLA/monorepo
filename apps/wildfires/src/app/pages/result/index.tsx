import { useAtom } from 'jotai';
import { HorizontalLayout } from '../../layout/horizontalLayout';
import { surveyResultsAtom } from '../../shared/atoms/surveyResultsAtom';
import BestPractices from '../../shared/components/bestPractices/BestPractices';
import GeneratePDF from '../../shared/components/GeneratePDF';
import Hero from '../../shared/components/hero/Hero';
import ImportantTips from '../../shared/components/importantTips/ImportantTips';
import Register from '../../shared/components/register/Register';
import { SurveyResults } from '../../shared/components/surveyResults/SurveyResults';

export default function Result() {
  const [surveyResults] = useAtom(surveyResultsAtom);

  return (
    <>
      <HorizontalLayout className="bg-brand-dark-blue">
        <Hero className="min-h-[60vh] py-14 md:py-28">
          <h1 className="font-light border-l-[10px] pl-4 md:pl-8 border-brand-yellow text-5xl text-white md:text-[74px] md:leading-[96.2px]">
            Thank you for helping us understand your situation. Here is a
            personalized action plan for you.
          </h1>
        </Hero>
      </HorizontalLayout>
      <HorizontalLayout>
        <div id="content-to-pdf">
          <BestPractices />
          {!!surveyResults && (
            <SurveyResults className="mt-8 mb-24" results={surveyResults} />
          )}
          <ImportantTips />
        </div>
        <GeneratePDF
          className="mb-16 md:mb-28 bg-brand-dark-blue text-white mx-auto"
          fileName="LA Disaster Relief Navigator"
        />
      </HorizontalLayout>

      <Register />
    </>
  );
}
