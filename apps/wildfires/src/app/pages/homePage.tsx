import { QuestionnaireWrapper } from '../shared/components/hello/QuestionnaireWrapper';
import { config } from '../shared/components/hello/config/config';

export function HomePage() {
  return (
    // <Questionnaire config={config}/>
    // <Questionnaire questions={config.questions} startIds={['start']} />
    // <Questionnaire
    //   questions={config.questions}
    //   // startIds={['start', 'second']}
    //   startIds={['start']}
    // />

    <QuestionnaireWrapper className="mt-8 border p-4" config={config} />
  );
}
