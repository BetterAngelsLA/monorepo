import { WizardLayout } from '../../components/layouts/WizardLayout';
import type { WizardStep } from '../../components/layouts/WizardProgressBar';

const STEPS: WizardStep[] = [
  { label: 'Add Profile' },
  { label: 'Select Shelter' },
  { label: 'Select Room / Bed' },
  { label: 'Confirmation' },
];

const PATHS = ['add-profile', 'select-shelter', 'select-room', 'confirmation'];

export function ReservationPage() {
  return <WizardLayout steps={STEPS} stepPaths={PATHS} />;
}
