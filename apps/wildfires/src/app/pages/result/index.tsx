import { useAtom } from 'jotai';
import { useRef } from 'react';
import NavigatorLogo from '../../../assets/images/la_disaster_relief_navigator_logo_dark.png';
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
        <HorizontalLayout className="bg-brand-dark-blue print:bg-white">
          <Hero className="relative min-h-[60vh] py-14 md:py-28 hero-print">
            <h1 className="font-light border-l-[10px] pl-4 md:pl-8 border-brand-yellow text-5xl text-white print:text-black md:text-[58px] md:leading-[1.2]">
              Your Wildfire
              <span className="md:hidden print:hidden">
                <br />
              </span>{' '}
              Recovery
              <span className="md:hidden print:hidden">
                <br />
              </span>{' '}
              Action Plan
            </h1>
            <div className="absolute bottom-0 left-0 right-0 pb-6 md:pb-8 print:pb-6 text-center hidden print:block">
              <img
                src={NavigatorLogo}
                alt="BA Logo"
                className="mx-auto w-32 md:w-40 print:w-32 print:h-12"
                style={{
                  width: 'auto',
                  maxHeight: '220px',
                }}
              />
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
