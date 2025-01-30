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
        {/* Print-only first page */}
        <div className="first-page-container print:block hidden">
          <HorizontalLayout className="bg-brand-dark-blue print:bg-white w-full">
            <Hero className="hero-print">
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
            </Hero>
          </HorizontalLayout>
          <div className="logo-container">
            <img
              src={NavigatorLogo}
              alt="LA Disaster Relief Navigator Logo"
              className="mx-auto w-32 print:w-32"
              style={{
                width: 'auto',
                maxHeight: '220px',
              }}
            />
          </div>
        </div>

        {/* Regular view (non-print) */}
        <div className="print:hidden">
          <HorizontalLayout className="bg-brand-dark-blue">
            <Hero className="min-h-[20vh] py-14 md:py-28">
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
            </Hero>
          </HorizontalLayout>
        </div>

        {/* Rest of the content */}
        <div className="content-section">
          <HorizontalLayout>
            <BestPractices />
            {surveyResults && (
              <SurveyResults className="mt-8 mb-24" results={surveyResults} />
            )}
          </HorizontalLayout>
        </div>
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
