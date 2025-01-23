import { useRef } from 'react';
import { HorizontalLayout } from '../../layout/horizontalLayout';
import GeneratePDF from '../../shared/components/GeneratePDF';
import { FiresSurvey } from './firesSurvey/FiresSurvey';

export function Introduction() {
  const pageRef = useRef<HTMLDivElement | null>(null);
  return (
    <div ref={pageRef}>
      <HorizontalLayout>
        <FiresSurvey />
      </HorizontalLayout>

      {/* Move to results page when we have one */}
      <GeneratePDF pageRef={pageRef} fileName="LA Disaster Relief Navigator" />
    </div>
  );
}
