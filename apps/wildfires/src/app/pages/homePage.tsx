import { Questionnaire } from '../shared/components/questionnaire/Questionnaire';
import { config } from '../shared/components/questionnaire/questionnaire.config';

export function HomePage() {

    return (
        <Questionnaire config={config}/>
    )
}
