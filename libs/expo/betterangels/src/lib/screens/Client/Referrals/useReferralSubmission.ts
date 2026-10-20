import { useMutation } from '@apollo/client/react';
import { useCallback } from 'react';
import {
  OperationMessageKind,
  extractOperationInfoMessages,
} from '../../../apollo';
import { useSnackbar } from '../../../hooks';
import {
  CreateReferralDocument,
  UpdateReferralDocument,
  type CreateReferralMutation,
  type UpdateReferralMutation,
} from './__generated__/Referrals.generated';
import {
  createReferralMeta,
  updateReferralMeta,
} from './__generated__/Referrals_meta.generated';
import type {
  ReferralDraftStore,
  ReferralSubmissionAttempt,
} from '../../../draft/referralDraft';
import { missingRequiredIntakeFields } from '../../../draft/intakeFields';
import {
  buildReferralNotes,
  updateReferralNotes,
} from './shared/referralIntakeSidecar';

/**
 * Only validation and permission messages are user-facing. `Error` is the
 * catch-all kind and can carry raw exception text, so it falls back to the
 * generic wording (matching the rest of the app; see
 * apps/betterangels-backend/docs/graphql_errors.md).
 */
function userFacingMessage(
  result: Parameters<typeof extractOperationInfoMessages>[0],
  operationKey: string,
): string | undefined {
  const messages = extractOperationInfoMessages(result, operationKey, [
    OperationMessageKind.Validation,
    OperationMessageKind.Permission,
  ]);
  return messages?.length
    ? messages.map((message) => message.message).join(', ')
    : undefined;
}

/** The store owns the operation, so pausing/unmounting a form cannot unlock it. */
export function useReferralSubmission(
  store: ReferralDraftStore,
  onSaved: () => void,
) {
  const [createReferral] = useMutation(CreateReferralDocument);
  const [updateReferral] = useMutation(UpdateReferralDocument);
  const { showSnackbar } = useSnackbar();
  return useCallback(async (draftId: string): Promise<boolean> => {
    const draft = store.getSnapshot();
    if (
      !draft ||
      draft.id !== draftId ||
      (draft.source?.kind !== 'edit' && !draft.selectedShelterId) ||
      missingRequiredIntakeFields(draft.answers).length
    )
      return false;
    let attempt: ReferralSubmissionAttempt | null;
    try {
      attempt = store.beginSubmission(draftId);
    } catch {
      showSnackbar({
        message: 'Could not save the draft on this device. Nothing was sent.',
        type: 'error',
      });
      return false;
    }
    if (!attempt) return false;
    let outcome: 'success' | 'rejected' | 'uncertain' = 'uncertain';
    let rejectionMessage: string | undefined;
    try {
      const submitted = attempt.draft;
      const source = submitted.source;
      let referral:
        | UpdateReferralMutation['updateReferral']
        | CreateReferralMutation['createReferral']
        | undefined;
      let successTypename: typeof createReferralMeta.successTypename;
      if (source?.kind === 'edit') {
        const result = await updateReferral({
          variables: {
            data: {
              id: source.referralId,
              notes: updateReferralNotes(
                source.originalNotes,
                submitted.storedValues,
              ),
            },
          },
        });
        referral = result.data?.updateReferral;
        successTypename = updateReferralMeta.successTypename;
        rejectionMessage = userFacingMessage(
          result,
          updateReferralMeta.operationKey,
        );
      } else {
        const result = await createReferral({
          variables: {
            data: {
              clientProfile: submitted.clientId,
              shelter: submitted.selectedShelterId ?? '',
              notes: buildReferralNotes(submitted.storedValues),
            },
          },
        });
        referral = result.data?.createReferral;
        successTypename = createReferralMeta.successTypename;
        rejectionMessage = userFacingMessage(
          result,
          createReferralMeta.operationKey,
        );
      }
      if (referral?.__typename === successTypename && referral.id)
        outcome = 'success';
      else if (referral?.__typename === 'OperationInfo') outcome = 'rejected';
    } catch {
      // A lost response may follow a successful server write. Do not invite an
      // immediate retry that would silently create a second referral.
    }
    try {
      if (!store.finishSubmission(attempt, outcome)) return false;
    } catch {
      showSnackbar({
        message:
          outcome === 'success'
            ? 'Referral saved, but the local draft could not be cleared. Check the referral list before retrying.'
            : 'Could not update the local draft. Check the referral list before retrying.',
        type: 'error',
      });
      if (outcome === 'success') onSaved();
      return outcome === 'success';
    }
    showSnackbar({
      message:
        outcome === 'success'
          ? attempt.draft.source?.kind === 'edit'
            ? 'Referral updated successfully!'
            : 'Referral saved. Share it separately to provide a copy.'
          : outcome === 'rejected'
            ? (rejectionMessage ??
              'The referral was not saved. Check your information and permissions, then try again.')
            : 'Could not confirm whether the referral was saved. Check the referral list before trying again.',
      type: outcome === 'success' ? 'success' : 'error',
    });
    if (outcome === 'success') onSaved();
    return outcome === 'success';
  }, [createReferral, onSaved, showSnackbar, store, updateReferral]);
}
