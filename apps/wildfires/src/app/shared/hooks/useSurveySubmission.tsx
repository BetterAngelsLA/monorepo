import { useCallback, useEffect, useRef, useState } from 'react';
import { isDeepEqual } from 'remeda';
import { v4 as uuidv4 } from 'uuid';
import { TSurveyResults } from '../../shared/components/survey/types';

const LOCAL_STORAGE_KEY = 'survey_submission';

interface StoredSurveyData {
  answers: TSurveyResults['answers'];
  surveyID: string;
}

type SubmissionStatus = 'idle' | 'loading' | 'success' | 'error';

/**
 * Custom hook to handle survey submission with retry logic and localStorage persistence.
 *
 * @param surveyResults - The current survey results.
 * @param maxRetries - Maximum number of retries for failed submissions (default: 3).
 * @param retryDelay - Delay between retries in milliseconds (default: 1000 ms).
 * @returns The current submission status.
 */
const useSurveySubmission = (
  surveyResults: TSurveyResults | null,
  maxRetries = 3,
  retryDelay = 1000,
): SubmissionStatus => {
  const [storedData, setStoredData] = useState<StoredSurveyData | null>(() => {
    const data = localStorage.getItem(LOCAL_STORAGE_KEY);
    return data ? JSON.parse(data) : null;
  });

  const [status, setStatus] = useState<SubmissionStatus>('idle');

  // Track active submissions to prevent duplicates
  const isSubmitting = useRef(false);

  /**
   * Attempts to submit the survey data to the server.
   *
   * @param survey - The survey results.
   * @param surveyID - The unique identifier for the survey.
   */
  const attemptSubmission = useCallback(
    async (survey: TSurveyResults, surveyID: string) => {
      const submitWithRetry = async (retries = 0): Promise<void> => {
        try {
          const response = await fetch(
            `${window.location.origin}/api/submitResults`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                id: surveyID,
                answers: survey.answers,
                timestamp: new Date(),
                referrer_base: import.meta.env.VITE_APP_BASE_PATH || '/',
              }),
            },
          );

          if (!response.ok) {
            throw new Error(`Server error: ${response.statusText}`);
          }

          const newStoredData: StoredSurveyData = {
            answers: survey.answers,
            surveyID,
          };

          setStoredData(newStoredData);
          localStorage.setItem(
            LOCAL_STORAGE_KEY,
            JSON.stringify(newStoredData),
          );
          setStatus('success');
          console.log('Survey submitted successfully:', surveyID);
        } catch (error) {
          console.error(`Attempt ${retries + 1} failed:`, error);

          if (retries < maxRetries) {
            await new Promise<void>((resolve) => {
              setTimeout(resolve, retryDelay);
            });

            await submitWithRetry(retries + 1);
          } else {
            setStatus('error');
            console.error(`Max retries reached for survey ID: ${surveyID}`);
          }
        }
      };

      setStatus('loading');
      isSubmitting.current = true;

      try {
        await submitWithRetry();
      } finally {
        isSubmitting.current = false;
      }
    },
    [maxRetries, retryDelay],
  );

  useEffect(() => {
    if (!surveyResults || isSubmitting.current) return;

    const { answers } = surveyResults;
    const isNewSubmission =
      !storedData || !isDeepEqual(answers, storedData.answers);

    if (isNewSubmission) {
      const surveyID = uuidv4();
      void attemptSubmission(surveyResults, surveyID);
    }
  }, [surveyResults, storedData, attemptSubmission]);

  return status;
};

export default useSurveySubmission;
