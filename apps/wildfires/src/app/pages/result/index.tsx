import { useAtom } from 'jotai';
import { useEffect } from 'react';
import { HorizontalLayout } from '../../layout/horizontalLayout';
import { surveyResultsAtom } from '../../shared/atoms/surveyResultsAtom';
import GeneratePDF from '../../shared/components/GeneratePDF';
import BestPractices from '../../shared/components/bestPractices/BestPractices';
import Hero from '../../shared/components/hero/Hero';
import ImportantTips from '../../shared/components/importantTips/ImportantTips';
import Partners from '../../shared/components/partners/Partners';
import Register from '../../shared/components/register/Register';
import { SurveyResults } from '../../shared/components/surveyResults/SurveyResults';

const currentDomain = window.location.origin;
const basename = import.meta.env.VITE_APP_BASE_PATH || '/';

export default function Result() {
  const [surveyResults] = useAtom(surveyResultsAtom);

  const submitSurvey = async (survey: any) => {
    try {
      const newDate = new Date();

      const surveyData = {
        answers: survey.answers,
        timestamp: newDate,
        referrer_base: basename,
      };

      await fetch(`${currentDomain}/api/submitResults`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(surveyData),
      });
    } catch (error) {
      console.error('Request failed', error);
    }
  };

  useEffect(() => {
    if (!surveyResults) {
      return;
    }

    submitSurvey(surveyResults);
  }, [surveyResults]);

  return (
    <>
      <HorizontalLayout className="bg-brand-dark-blue">
        <Hero className="min-h-[60vh] py-14 md:py-28">
          <h1 className="font-light border-l-[10px] pl-4 md:pl-8 border-brand-yellow text-5xl text-white md:text-[74px] md:leading-[96.2px]">
            Your Wildfire Recovery Action Plan
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
      <HorizontalLayout className="bg-brand-sky-blue">
        <Partners />
      </HorizontalLayout>
    </>
  );
}
