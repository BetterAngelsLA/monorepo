import { useRef } from 'react';
import GeneratePDF from '../../shared/components/GeneratePDF';
import { FiresSurvey } from './firesSurvey/FiresSurvey';

export function Introduction() {
  const pageRef = useRef<HTMLDivElement | null>(null);
  return (
    <div ref={pageRef}>
      <FiresSurvey />

      {/* Move to results page when we have one */}
      <GeneratePDF pageRef={pageRef} fileName="Wildfire LA" />
    </div>
  );
}
