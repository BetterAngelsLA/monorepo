import { Survey } from '../../../shared/components/survey/Survey';
import { TSurveyUi } from '../../../shared/components/survey/provider/SurveyContext';
import SurveyProvider from '../../../shared/components/survey/provider/SurveyProvider';
import { SurveyCheckbox } from './components/SurveyCheckbox';
import { surveyConfig } from './config/config';

const customUi: TSurveyUi = {
  Checkbox: SurveyCheckbox,
};

export function FiresSurvey() {
  function onChange(results: any) {
    console.log('FiresSurvey results change:');
    console.log(results);
  }

  return (
    <SurveyProvider surveyForms={surveyConfig} ui={customUi}>
      <Survey className="mt-8" onChange={onChange} />
    </SurveyProvider>
  );
}
