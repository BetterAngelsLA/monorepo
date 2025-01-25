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
  retryDelay = 1000
): SubmissionStatus => {
  const [storedData, setStoredDataState] = useState<StoredSurveyData | null>(
    () => {
      const data = localStorage.getItem(LOCAL_STORAGE_KEY);
      return data ? JSON.parse(data) : null;
    }
  );

  const [status, setStatus] = useState<SubmissionStatus>('idle');

  // Track active submissions to prevent duplicates
  const isSubmitting = useRef(false);

  /**
   * Attempts to submit the survey data to the server.
   *
   * @param survey - The survey results.
   * @param surveyID - The unique identifier for the survey.
   * @param retries - Current retry attempt (default: 0).
   */
  const attemptSubmission = useCallback(
    async (survey: TSurveyResults, surveyID: string, retries = 0) => {
      setStatus('loading');
      isSubmitting.current = true;

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
          }
        );

        if (!response.ok) {
          throw new Error(`Server error: ${response.statusText}`);
        }

        // Update localStorage and state after a successful submission
        const newStoredData: StoredSurveyData = {
          answers: survey.answers,
          surveyID,
        };
        setStoredDataState(newStoredData);
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newStoredData));
        setStatus('success');
        console.log('Survey submitted successfully:', surveyID);
      } catch (error) {
        console.error(`Attempt ${retries + 1} failed:`, error);

        if (retries < maxRetries) {
          setTimeout(
            () => attemptSubmission(survey, surveyID, retries + 1),
            retryDelay
          );
        } else {
          setStatus('error');
          console.error(`Max retries reached for survey ID: ${surveyID}`);
        }
      } finally {
        isSubmitting.current = false;
      }
    },
    [maxRetries, retryDelay]
  );

  useEffect(() => {
    if (!surveyResults || isSubmitting.current) return;

    const { answers } = surveyResults;
    const isNewSubmission =
      !storedData || !isDeepEqual(answers, storedData.answers);

    if (isNewSubmission) {
      const surveyID = uuidv4();
      attemptSubmission(surveyResults, surveyID);
    }
  }, [surveyResults, storedData, attemptSubmission]);

  return status;
};

export default useSurveySubmission;
