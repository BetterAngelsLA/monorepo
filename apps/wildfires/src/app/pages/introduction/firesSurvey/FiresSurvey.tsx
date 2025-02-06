import { useAtom } from 'jotai';
import { useNavigate } from 'react-router-dom';
import { surveyResultsPagePath } from '../../../routes/routePaths';
import { surveyResultsAtom } from '../../../shared/atoms/surveyResultsAtom';
import { Survey } from '../../../shared/components/survey/Survey';
import { TSurveyUi } from '../../../shared/components/survey/provider/SurveyContext';
import SurveyProvider from '../../../shared/components/survey/provider/SurveyProvider';
import { TSurveyResults } from '../../../shared/components/survey/types';
import { SurveyCheckbox } from './components/SurveyCheckbox';
import { surveyConfig } from './config/config';

const customUi: TSurveyUi = {
  Checkbox: SurveyCheckbox,
};

export function FiresSurvey() {
  const [_surveyResults, storeSurveyResults] = useAtom(surveyResultsAtom);
  const navigateTo = useNavigate();

  function onChange(results: any) {}

  function onSurveyEnd(results: TSurveyResults) {
    storeSurveyResults(results);

    navigateTo(surveyResultsPagePath);
  }

  function scrollTop() {
    window.scrollTo(0, 0);
  }

  function onFormRender() {
    scrollTop();
  }

  function onFormBack() {
    scrollTop();
  }

  return (
    <SurveyProvider
      surveyForms={surveyConfig}
      ui={customUi}
      onSurveyEnd={onSurveyEnd}
      onFormRender={onFormRender}
      onFormBack={onFormBack}
    >
      <Survey className="mt-8" onChange={onChange} />
    </SurveyProvider>
  );
}
