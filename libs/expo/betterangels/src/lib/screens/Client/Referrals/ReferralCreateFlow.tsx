import type { ComponentProps } from 'react';
import { ReferralForm } from './ReferralForm';
import { ReferralIntakeForm } from './ReferralIntakeForm';
import { useReferralDraft } from './ReferralDraftProvider';
import { needLabelsFromIntake } from './clientNeeds';
import { buildReferralNotes } from './referralIntakeSidecar';

// Two-step create flow: Required-Info intake (prototype) → shelter picker.
export function ReferralCreateFlow({
  clientId,
  onCancel,
  onPause,
  onSubmit,
  profile,
  onEditProfile,
}: {
  clientId: string;
  onCancel: () => void;
  onPause: () => void;
  onSubmit: (shelterId: string, notes: string | undefined) => Promise<boolean>;
  profile?: ComponentProps<typeof ReferralIntakeForm>['profile'];
  onEditProfile?: () => void;
}) {
  const { draft, store } = useReferralDraft();
  if (!draft || draft.clientId !== clientId) return null;

  if (draft.step === 'intake') {
    return (
      <ReferralIntakeForm
        onCancel={onCancel}
        onPause={onPause}
        onContinue={() => store.setStep('picker')}
        profile={profile}
        onEditProfile={onEditProfile}
      />
    );
  }
  return (
    <ReferralForm
      onCancel={onCancel}
      onPause={onPause}
      // Lossless: setStep rewrites only step/updatedAt, so the answers and the
      // selection survive.
      onBack={() => store.setStep('intake')}
      selectedShelterId={draft.selectedShelterId}
      onSelectShelter={(id) => store.setShelter(id)}
      onSubmit={(shelterId, pickerNotes) => {
        const current = store.getSnapshot();
        if (!current || current.clientId !== clientId)
          return Promise.resolve(false);
        return onSubmit(
          shelterId,
          buildReferralNotes(current.storedValues, pickerNotes),
        );
      }}
      desiredAttributes={needLabelsFromIntake(draft.storedValues)}
    />
  );
}
