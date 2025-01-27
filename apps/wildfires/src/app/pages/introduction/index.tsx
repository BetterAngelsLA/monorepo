import { HorizontalLayout } from '../../layout/horizontalLayout';
import { FiresSurvey } from './firesSurvey/FiresSurvey';

export function Introduction() {
  return (
    <div>
      <HorizontalLayout>
        <FiresSurvey />
      </HorizontalLayout>
    </div>
  );
}
