import { useNavigate } from 'react-router-dom';
import { surveyResultsPagePath } from '../../../routes/routePaths';
import { Survey } from '../../../shared/components/survey/Survey';
import { TSurveyUi } from '../../../shared/components/survey/provider/SurveyContext';
import SurveyProvider from '../../../shared/components/survey/provider/SurveyProvider';
import { TResults } from '../../../shared/components/survey/types';
import { SurveyCheckbox } from './components/SurveyCheckbox';
import { surveyConfig } from './config/config';

const customUi: TSurveyUi = {
  Checkbox: SurveyCheckbox,
};

export function FiresSurvey() {
  const navigateTo = useNavigate();

  function onChange(results: any) {
    // console.log('FiresSurvey results change:');
    // console.log(results);
  }

  function onSurveyEnd(results: TResults) {
    console.log('################################### ON END');
    console.log(results);
    console.log();

    navigateTo(surveyResultsPagePath);
  }

  return (
    <SurveyProvider
      surveyForms={surveyConfig}
      ui={customUi}
      onSurveyEnd={onSurveyEnd}
    >
      <Survey className="mt-8" onChange={onChange} />
    </SurveyProvider>
  );
}
