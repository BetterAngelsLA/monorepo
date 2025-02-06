import { atomWithStorage } from 'jotai/utils';
import { TSurveyResults } from '../components/survey/types';

const cacheKey = 'wildfireSurveyResults';

export const surveyResultsAtom = atomWithStorage<TSurveyResults | null>(
  cacheKey,
  null
);
