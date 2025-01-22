import { useRef } from 'react';
import GeneratePDF from '../../shared/components/GeneratePDF';
import { FiresSurvey } from './firesSurvey/FiresSurvey';

export function Introduction() {
  const pageRef = useRef<HTMLDivElement | null>(null);
  return (
    <div ref={pageRef}>
      <FiresSurvey />

      <GeneratePDF pageRef={pageRef} fileName="Wildfire LA" />
    </div>
  );
}
