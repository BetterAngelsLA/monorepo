import { RouteObject } from 'react-router-dom';
import Policy from '../pages/Policy';
import About from '../pages/about';
import { HomePage } from '../pages/homePage';
import { Introduction } from '../pages/introduction';
import Result from '../pages/result';
import {
  aboutPagePath,
  privacyPolicyPagePath,
  surveyPagePath,
  surveyResultsPagePath,
} from './routePaths';

export const routeChildren: RouteObject[] = [
  {
    path: '/',
    element: <HomePage />,
  },
  {
    path: aboutPagePath,
    element: <About />,
  },
  {
    path: surveyResultsPagePath,
    element: <Result />,
  },
  {
    path: surveyPagePath,
    element: <Introduction />,
  },
  {
    path: privacyPolicyPagePath,
    element: <Policy />,
  },
];
