import type { ReferralDraftSeed } from '../../../draft/referralDraft';
import { prepareIntakeReuse } from './intakeReuse';
import {
  canEditReferralNotes,
  decodeReferralNotes,
} from './shared/referralIntakeSidecar';

export function referralDraftSeed(
  referral: {
    id: string;
    notes?: string | null;
    shelter?: { id: string } | null;
  },
  mode: 'edit' | 'reuse',
): ReferralDraftSeed | null {
  if (!canEditReferralNotes(referral.notes)) return null;
  const { intake, humanNotes } = decodeReferralNotes(referral.notes);
  if (mode === 'edit')
    return {
      source: {
        kind: 'edit',
        referralId: referral.id,
        originalNotes: referral.notes ?? '',
      },
      values: { ...intake, notes: humanNotes },
      selectedShelterId: referral.shelter?.id ?? null,
    };
  const { values, reviewKeys, skippedKeys } = prepareIntakeReuse(intake);
  return {
    source: { kind: 'reuse', referralId: referral.id, reviewKeys, skippedKeys },
    values,
    selectedShelterId: null,
  };
}
