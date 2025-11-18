import { HmisProgramNoteEdit } from '@monorepo/expo/betterangels';
import { useLocalSearchParams } from 'expo-router';

type TSearchParams = {
  id: string;
  hmisClientId: string;
  hmisNoteEnrollmentId: string;
  arrivedFrom?: string;
};

export default function InteractionsHmisEdit() {
  const {
    id: hmisNoteId,
    hmisClientId,
    hmisNoteEnrollmentId,
    arrivedFrom,
  } = useLocalSearchParams<TSearchParams>();

  if (!hmisNoteId || !hmisClientId || !hmisNoteEnrollmentId) {
    throw new Error('Something went wrong. Please try again.');
  }

  return (
    <HmisProgramNoteEdit
      hmisNoteId={hmisNoteId}
      hmisClientId={hmisClientId}
      hmisNoteEnrollmentId={hmisNoteEnrollmentId}
      arrivedFrom={arrivedFrom}
    />
  );
}
