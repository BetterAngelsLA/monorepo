// Result.tsx
import { useQuery } from '@tanstack/react-query';
import { useAtom } from 'jotai';
import { useRef } from 'react';
import NavigatorLogo from '../../../assets/images/la_disaster_relief_navigator_logo_dark.png';
import { HorizontalLayout } from '../../layout/horizontalLayout';
import { surveyResultsAtom } from '../../shared/atoms/surveyResultsAtom';
import { fetchAllAlertsAndResourcesByTagsFn } from '../../shared/clients/sanityCms/queries/fetchAllAlertsAndResourcesByTagsFn';
import BestPractices from '../../shared/components/bestPractices/BestPractices';
import GeneratePDF from '../../shared/components/GeneratePDF';
import Hero from '../../shared/components/hero/Hero';
import Partners from '../../shared/components/partners/Partners';
import Register from '../../shared/components/register/Register';
import { getAllQuestions } from '../../shared/components/survey/utils/validateConfig';
import { SurveyResults } from '../../shared/components/surveyResults/SurveyResults';
import useSurveySubmission from '../../shared/hooks/useSurveySubmission';
import { PrintProvider } from '../../shared/providers/PrintProvider';
import { surveyConfig } from '../introduction/firesSurvey/config/config';

const allQuestions = getAllQuestions(surveyConfig);

function findQuestionById(id: string) {
  return allQuestions.find((q) => q.id === id);
}

function getAnswerTags(answer: any, answerOptions: any[]): string[] {
  const answerTags: string[] = [];
  let results = answer.result;
  if (typeof results === 'string') {
    results = [results];
  }
  for (const result of results) {
    const resultOption = answerOptions.find((o) => o.optionId === result);
    if (!resultOption) continue;
    const optionTags = resultOption.tags || [];
    for (const tag of optionTags) {
      answerTags.push(tag);
    }
  }
  return answerTags;
}

function getTags(answers: any[]): string[] {
  const tags: string[] = [];
  for (const answer of answers) {
    const questionAnswered = findQuestionById(answer.questionId);
    if (!questionAnswered?.options) continue;
    const answerTags = getAnswerTags(answer, questionAnswered.options);
    tags.push(...answerTags);
  }
  return tags;
}

export default function Result() {
  const [surveyResults] = useAtom(surveyResultsAtom);
  const printContentRef = useRef<HTMLDivElement>(null);
  useSurveySubmission(surveyResults || null);

  // Only attempt to fetch if surveyResults exist.
  const queryTags =
    surveyResults && surveyResults.answers
      ? getTags(surveyResults.answers)
      : [];

  // Use React Query to fetch resources based on tags.
  const {
    isLoading,
    isError,
    data: resources,
    error,
  } = useQuery({
    queryKey: queryTags,
    queryFn: () => fetchAllAlertsAndResourcesByTagsFn(queryTags),
    refetchOnWindowFocus: false,
    retry: 1,
    enabled: queryTags.length > 0, // only run if there are tags
  });

  return (
    <>
      {/* Content included in the PDF */}
      <div className="w-full" id="print-container" ref={printContentRef}>
        <HorizontalLayout className="bg-brand-dark-blue print:bg-white">
          <Hero className="hero-print min-h-[20vh] py-14 md:py-28 relative">
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
            {/* Print-only Logo */}
            <div className="print-logo-container hidden print:block">
              <img
                src={NavigatorLogo}
                alt="LA Disaster Relief Navigator Logo"
                className="mx-auto w-32 print:w-auto print:max-h-12"
                style={{
                  maxWidth: '220px',
                  height: 'auto',
                }}
              />
            </div>
          </Hero>
        </HorizontalLayout>

        {/* Horizontal Layout for print only */}
        <PrintProvider initialIsPrinting={true}>
          <div className="hidden print:block notranslate">
            <HorizontalLayout>
              <BestPractices />
              {resources && (
                <SurveyResults
                  className="mt-8 mb-24"
                  resources={resources}
                  isLoading={isLoading}
                  isError={isError}
                  error={error}
                />
              )}
            </HorizontalLayout>
          </div>
        </PrintProvider>
      </div>

      {/* Horizontal Layout for screen (non-print) only */}
      <PrintProvider>
        <div className="print:hidden">
          <HorizontalLayout>
            <BestPractices />
            {resources && (
              <SurveyResults
                className="mt-8 mb-24"
                resources={resources}
                isLoading={isLoading}
                isError={isError}
                error={error}
              />
            )}
          </HorizontalLayout>
        </div>
      </PrintProvider>
      {/* Additional webpage-only content */}
      <HorizontalLayout className="mb-16 md:mb-28 print:hidden">
        <div className="flex flex-col items-center">
          <GeneratePDF
            printRef={printContentRef}
            className="bg-brand-dark-blue text-white"
          />
        </div>
      </HorizontalLayout>
      <Register />
      <HorizontalLayout className="bg-brand-sky-blue print:hidden">
        <Partners />
      </HorizontalLayout>
    </>
  );
}
