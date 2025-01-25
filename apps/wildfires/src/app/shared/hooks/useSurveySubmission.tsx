// src/hooks/useSurveySubmission.ts
import { useEffect, useState } from 'react';
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
 * Custom hook to handle survey submission with unique IDs and localStorage persistence.
 *
 * @param surveyResults - The current survey results.
 * @returns The current submission status.
 */
const useSurveySubmission = (
  surveyResults: TSurveyResults | null
): SubmissionStatus => {
  const [storedData, setStoredDataState] = useState<StoredSurveyData | null>(
    () => {
      const data = localStorage.getItem(LOCAL_STORAGE_KEY);
      return data ? (JSON.parse(data) as StoredSurveyData) : null;
    }
  );

  const [status, setStatus] = useState<SubmissionStatus>('idle');

  useEffect(() => {
    if (!surveyResults) return;

    const { answers } = surveyResults;

    // If there's no stored data, treat this as the first submission
    if (!storedData) {
      const newID = uuidv4();
      submitSurvey(surveyResults, newID);
      const newStoredData: StoredSurveyData = { answers, surveyID: newID };
      setStoredDataState(newStoredData);
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newStoredData));
      return;
    }

    // Compare current answers with stored answers
    if (!isDeepEqual(answers, storedData.answers)) {
      const newID = uuidv4();
      submitSurvey(surveyResults, newID);
      const newStoredData: StoredSurveyData = { answers, surveyID: newID };
      setStoredDataState(newStoredData);
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newStoredData));
    } else {
      console.log('No changes in answers. Submission skipped.');
    }
  }, [surveyResults, storedData]);

  /**
   * Submits the survey data to the server.
   *
   * @param survey - The survey results.
   * @param surveyID - The unique identifier for the survey.
   */
  const submitSurvey = async (survey: TSurveyResults, surveyID: string) => {
    setStatus('loading');
    try {
      const surveyData = {
        id: surveyID,
        answers: survey.answers,
        timestamp: new Date(),
        referrer_base: import.meta.env.VITE_APP_BASE_PATH || '/',
      };

      const response = await fetch(
        `${window.location.origin}/api/submitResults`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(surveyData),
        }
      );

      if (!response.ok) {
        throw new Error(`Server error: ${response.statusText}`);
      }
      console.log('Survey submitted successfully with ID:', surveyID);
      setStatus('success');
    } catch (error) {
      console.error('Survey submission failed:', error);
      setStatus('error');
    }
  };

  return status;
};

export default useSurveySubmission;
