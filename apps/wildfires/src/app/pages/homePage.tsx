import { QuestionnaireWrapper } from '../shared/components/hello/QuestionnaireWrapper';
import { config } from '../shared/components/hello/config/config';
import QuestionnaireProvider from '../shared/components/hello/provider/questionnaireProvider';

export function HomePage() {
  return (
    // <Questionnaire config={config}/>
    // <Questionnaire questions={config.questions} startIds={['start']} />
    // <Questionnaire
    //   questions={config.questions}
    //   // startIds={['start', 'second']}
    //   startIds={['start']}
    // />

    <QuestionnaireProvider>
      <QuestionnaireWrapper className="mt-8 border p-4" config={config} />
    </QuestionnaireProvider>
  );
}
