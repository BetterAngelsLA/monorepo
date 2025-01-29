import { useAtom } from 'jotai';
import { useRef } from 'react';
import { HorizontalLayout } from '../../layout/horizontalLayout';
import { surveyResultsAtom } from '../../shared/atoms/surveyResultsAtom';
import GeneratePDF from '../../shared/components/GeneratePDF';
import BestPractices from '../../shared/components/bestPractices/BestPractices';
import Hero from '../../shared/components/hero/Hero';
import Partners from '../../shared/components/partners/Partners';
import Register from '../../shared/components/register/Register';
import { SurveyResults } from '../../shared/components/surveyResults/SurveyResults';
import useSurveySubmission from '../../shared/hooks/useSurveySubmission';

export default function Result() {
  const [surveyResults] = useAtom(surveyResultsAtom);
  const printContentRef = useRef<HTMLDivElement>(null);
  useSurveySubmission(surveyResults || null);

  return (
    <>
      {/* Content that will be included in the PDF */}
      <div className="w-full" id="print-container" ref={printContentRef}>
        <HorizontalLayout className="bg-brand-dark-blue">
          <Hero className="min-h-[60vh] py-14 md:py-28 hero-print">
            <div className="container mx-auto px-4">
              <h1 className="font-light border-l-[10px] pl-3 md:pl-8 border-brand-yellow text-white md:text-left">
                <div className="flex flex-col justify-center md:block">
                  <span className="text-[28px] leading-[1.2] md:text-[60px] md:leading-[1.2] text-left md:text-left block">
                    Your Wildfire Recovery
                  </span>
                  <span className="text-[28px] leading-[1.2] md:text-[60px] md:leading-[1.2] text-left block mt-2">
                    Action Plan
                  </span>
                </div>
              </h1>
            </div>
          </Hero>
        </HorizontalLayout>
        <HorizontalLayout>
          <BestPractices />
          {surveyResults && (
            <SurveyResults className="mt-8 mb-24" results={surveyResults} />
          )}
        </HorizontalLayout>
      </div>

      {/* Content that will only show on the webpage */}
      <HorizontalLayout className="mb-16 md:mb-28">
        <div className="flex flex-col items-center">
          <GeneratePDF
            targetRef={printContentRef}
            className="bg-brand-dark-blue text-white"
            fileName="LA Disaster Relief Navigator.pdf"
          />
        </div>
      </HorizontalLayout>
      <Register />
      <HorizontalLayout className="bg-brand-sky-blue">
        <Partners />
      </HorizontalLayout>
    </>
  );
}
