import { HmisProgramNoteEdit } from '@monorepo/expo/betterangels';
import { useLocalSearchParams } from 'expo-router';

type TSearchParams = {
  id: string;
  clientHmisId: string;
  hmisNoteEnrollmentId: string;
  arrivedFrom?: string;
};

export default function InteractionsHmisEdit() {
  const {
    id: noteHmisId,
    clientHmisId,
    hmisNoteEnrollmentId,
    arrivedFrom,
  } = useLocalSearchParams<TSearchParams>();

  if (!noteHmisId || !clientHmisId || !hmisNoteEnrollmentId) {
    throw new Error('Something went wrong. Please try again.');
  }

  return (
    <HmisProgramNoteEdit
      noteHmisId={noteHmisId}
      clientHmisId={clientHmisId}
      hmisNoteEnrollmentId={hmisNoteEnrollmentId}
      arrivedFrom={arrivedFrom}
    />
  );
}
