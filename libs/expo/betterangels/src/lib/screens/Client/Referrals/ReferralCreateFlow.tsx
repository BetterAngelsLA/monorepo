import { useMemo } from 'react';
import { Pressable, View } from 'react-native';
import { TextRegular } from '@monorepo/expo/shared/ui-components';
import type { ComponentProps } from 'react';
import { ReferralForm } from './ReferralForm';
import { ReferralIntakeForm } from './ReferralIntakeForm';
import { useReferralDraft } from './ReferralDraftProvider';
import { needLabelsFromIntake } from './clientNeeds';
import { useLocalDraftAction } from './useLocalDraftAction';

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
  onSubmit: () => Promise<boolean>;
  profile?: ComponentProps<typeof ReferralIntakeForm>['profile'];
  onEditProfile?: () => void;
}) {
  const { draft, store } = useReferralDraft();
  const runDraftAction = useLocalDraftAction();
  // Stable while the saved answers are unchanged, so the picker's ranking memo
  // is not invalidated by every parent render.
  const desiredAttributes = useMemo(
    () => needLabelsFromIntake(draft?.storedValues),
    [draft?.storedValues],
  );
  if (!draft || draft.clientId !== clientId) return null;

  if (draft.submission.status === 'saved') {
    return (
      <View>
        <TextRegular>
          This referral was saved. Its local draft still needs to be cleared.
        </TextRegular>
        <Pressable accessibilityRole="button" onPress={onPause}>
          <TextRegular>Close</TextRegular>
        </Pressable>
        <Pressable accessibilityRole="button" onPress={onCancel}>
          <TextRegular>Clear saved draft</TextRegular>
        </Pressable>
      </View>
    );
  }
  if (draft.submission.status === 'uncertain') {
    return (
      <View testID="referral-uncertain-screen">
        <TextRegular>
          We could not confirm whether this referral was saved. Close this form
          and check the referral list before trying again.
        </TextRegular>
        <Pressable accessibilityRole="button" onPress={onPause}>
          <TextRegular>Check referral list</TextRegular>
        </Pressable>
        <Pressable
          testID="confirm-referral-retry-btn"
          accessibilityRole="button"
          onPress={() =>
            runDraftAction(() => store.acknowledgeUncertainSubmission(draft.id))
          }
        >
          <TextRegular>I checked — allow another attempt</TextRegular>
        </Pressable>
      </View>
    );
  }
  if (draft.source?.kind === 'edit' && draft.submission.status === 'pending') {
    return (
      <View>
        <TextRegular>Saving changes…</TextRegular>
        <Pressable accessibilityRole="button" onPress={onPause}>
          <TextRegular>Pause</TextRegular>
        </Pressable>
      </View>
    );
  }
  if (draft.step === 'intake') {
    return (
      <ReferralIntakeForm
        onCancel={onCancel}
        onPause={onPause}
        editing={draft.source?.kind === 'edit'}
        onContinue={() => {
          if (draft.source?.kind === 'edit') void onSubmit();
          else runDraftAction(() => store.setStep('picker'));
        }}
        profile={profile}
        onEditProfile={onEditProfile}
      />
    );
  }
  return (
    <ReferralForm
      onCancel={onCancel}
      onBack={() => runDraftAction(() => store.setStep('intake'))}
      onPause={onPause}
      submitting={draft.submission.status === 'pending'}
      selectedShelterId={draft.selectedShelterId}
      onSelectShelter={(id) => runDraftAction(() => store.setShelter(id))}
      onSubmit={onSubmit}
      desiredAttributes={desiredAttributes}
    />
  );
}
