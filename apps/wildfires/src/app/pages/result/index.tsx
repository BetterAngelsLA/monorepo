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
      {/* ---------------------------------
          PRINTABLE CONTENT
      --------------------------------- */}
      <div className="w-full" id="print-container" ref={printContentRef}>
        <HorizontalLayout className="bg-brand-dark-blue print:bg-white">
          <Hero className="hero-print min-h-[20vh] py-14 md:py-28 relative">
            {/*
              1) Border: Yellow on screen, Blue in print
              2) Force single line in print
              3) Adjust font size in print so it doesn't wrap
            */}
            <h1
              className="
                whitespace-nowrap
                print:whitespace-nowrap
                border-l-[10px]
                border-brand-yellow
                print:border-brand-sky-blue
                text-white
                print:text-black
                font-light
                pl-4
                md:pl-8
                text-5xl
                md:text-[58px]
                md:leading-[1.2]
                print:text-4xl
                mx-auto
              "
              style={{ maxWidth: '90%' }} // Optionally ensure no wrapping
            >
              Your Wildfire Recovery Action Plan
            </h1>

            {/* Print-only Logo */}
            <div className="print-logo-container hidden print:block">
              <img
                src={NavigatorLogo}
                alt="LA Disaster Relief Navigator Logo"
                className="mx-auto w-32 print:w-auto print:max-h-16"
                style={{
                  maxWidth: '200px',
                  height: 'auto',
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

      {/* ---------------------------------
          WEB-ONLY CONTENT
      --------------------------------- */}
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
