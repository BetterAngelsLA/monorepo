import { HorizontalLayout } from '../../layout/horizontalLayout';
import BestPractices from '../../shared/components/bestPractices/BestPractices';

export default function ResultPdfpage() {
  return (
    <HorizontalLayout className="pt-4">
      HELLO PDF
      <BestPractices expanded={true} />
    </HorizontalLayout>
  );
}
