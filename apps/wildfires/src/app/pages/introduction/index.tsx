import { HorizontalLayout } from '../../layout/horizontalLayout';
import { FiresSurvey } from './firesSurvey/FiresSurvey';

export function Introduction() {
  return (
    <div className="w-full">
      <HorizontalLayout>
        <FiresSurvey />
      </HorizontalLayout>
    </div>
  );
}
