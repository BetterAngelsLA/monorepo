import { useMutation, useQuery } from '@apollo/client/react';
import {
  Colors,
  FontSizes,
  Radiuses,
  Spacings,
} from '@monorepo/expo/shared/static';
import {
  Button,
  KeyboardAwareScrollView,
  LoadingView,
  TextBold,
  TextRegular,
} from '@monorepo/expo/shared/ui-components';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { UpdateNoteDocument, ViewNoteDocument } from '../../apollo';
import { generatePublicNote } from '../../helpers';

export default function PublicNote({ noteId }: { noteId: string }) {
  const { data, loading: isLoading } = useQuery(ViewNoteDocument, {
    variables: { id: noteId },
    fetchPolicy: 'network-only',
  });
  const [updateNote] = useMutation(UpdateNoteDocument);
  const [autoNote, setAutoNote] = useState<string>('');
  const [publicNote, setPublicNote] = useState<string>('');
  const [userChange, setUserChange] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const router = useRouter();
  const insets = useSafeAreaInsets();
  const bottomOffset = insets.bottom;

  const onChange = (value: string) => {
    setUserChange(true);
    setPublicNote(value);
  };

  const handleSaveNote = async () => {
    if (!noteId) return;

    setIsSaving(true);
    try {
      await updateNote({
        variables: {
          data: {
            id: noteId,
            publicDetails: publicNote,
          },
        },
      });
      router.back();
    } catch (err) {
      console.error('Failed to save note:', err);
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    if (!data || !('note' in data) || userChange) return;
    const autoNote = generatePublicNote({
      purpose: data.note.purpose,
      moods: data.note.moods,
      providedServices: data.note.providedServices,
      requestedServices: data.note.requestedServices,
    });

    setAutoNote(autoNote);
    setPublicNote(data.note.publicDetails);
  }, [data, userChange]);

  if (isLoading) {
    return <LoadingView />;
  }

  return (
    <>
      <KeyboardAwareScrollView>
        <View
          style={{
            gap: Spacings.sm,
            flex: 1,
          }}
        >
          <TextBold size="lg">Write Note</TextBold>
          <TextRegular size="md">
            Use the generated text below to get started. When finished, tap
            “Save Note.”
          </TextRegular>

          <View style={{ flexGrow: 1 }}>
            <TextInput
              value={publicNote}
              onChangeText={(text) => onChange(text)}
              multiline
              accessibilityHint="area to write a note"
              textAlignVertical="top"
              accessibilityLabel="Note input"
              style={styles.input}
              placeholder={
                'Tap “Generate” to auto-draft a note in GIRP format. When finished, tap “Save Note.”'
              }
            />
          </View>
        </View>
      </KeyboardAwareScrollView>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: Colors.WHITE,
          padding: Spacings.sm,
          paddingBottom: bottomOffset + Spacings.sm,
          gap: Spacings.xs,
          elevation: 5,
          shadowColor: '#CCC',
          shadowOffset: { width: 0, height: -3 },
          shadowOpacity: 0.3,
          shadowRadius: Radiuses.xxs,
        }}
      >
        <View
          style={{
            flex: 1,
          }}
        >
          <Button
            onPress={() => {
              if (!publicNote) {
                onChange(autoNote);
              } else {
                onChange('');
              }
            }}
            height="xl"
            accessibilityHint="Generates or clears GIRP note"
            size="full"
            variant="secondary"
            title={(!!publicNote && 'Clear') || 'Generate'}
          />
        </View>

        <View style={{ flex: 1 }}>
          <Button
            onPress={handleSaveNote}
            height="xl"
            accessibilityHint="saves the note"
            size="full"
            variant="primary"
            title="Save Note"
            disabled={isSaving}
          />
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  input: {
    flex: 1,
    padding: Spacings.sm,
    fontFamily: 'Poppins-Regular',
    fontSize: FontSizes.md.fontSize,
    color: Colors.PRIMARY_EXTRA_DARK,
    backgroundColor: Colors.WHITE,
    borderColor: Colors.NEUTRAL_LIGHT,
    borderWidth: 1,
    borderRadius: Radiuses.xs,
    alignItems: 'center',
    flexDirection: 'row',
  },
});
