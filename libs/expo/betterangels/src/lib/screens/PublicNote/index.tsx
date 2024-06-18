import { Colors, Spacings } from '@monorepo/expo/shared/static';
import {
  Button,
  TextBold,
  TextRegular,
} from '@monorepo/expo/shared/ui-components';
import { debounce } from '@monorepo/expo/shared/utils';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import { useUpdateNoteMutation, useViewNoteQuery } from '../../apollo';
import { generatePublicNote } from '../../helpers';
import { MainScrollContainer } from '../../ui-components';

export default function PublicNote({ noteId }: { noteId: string }) {
  const { data, loading: isLoading } = useViewNoteQuery({
    variables: { id: noteId },
    fetchPolicy: 'network-only',
  });
  const [updateNote, { error }] = useUpdateNoteMutation();
  const [autoNote, setAutoNote] = useState<string>('');
  const [publicNote, setPublicNote] = useState<string>('');
  const [userChange, setUserChange] = useState(false);

  const router = useRouter();

  const updateNoteFunction = useRef(
    debounce(async (value: string) => {
      if (!noteId) return;

      try {
        const { data } = await updateNote({
          variables: {
            data: {
              id: noteId,
              publicDetails: value,
            },
          },
        });

        if (!data) {
          console.error(`Failed to update interaction: ${error}`);
        }
      } catch (err) {
        console.error(err);
      }
    }, 500)
  ).current;

  const onChange = (value: string) => {
    setUserChange(true);
    setPublicNote(value);
    updateNoteFunction(value);
  };

  useEffect(() => {
    if (!data || !('note' in data) || userChange) return;
    const autoNote = generatePublicNote({
      purposes: data.note.purposes,
      nextSteps: data.note.nextSteps,
      moods: data.note.moods,
      providedServices: data.note.providedServices,
      requestedServices: data.note.requestedServices,
    });

    setAutoNote(autoNote);

    if (data.note.publicDetails) {
      setPublicNote(data.note.publicDetails);
    } else {
      onChange(autoNote);
    }
  }, [data, userChange]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        {/* There should be loading from other PR */}
        <TextRegular>Loading</TextRegular>
      </View>
    );
  }

  return (
    <MainScrollContainer pb={40} bg={Colors.NEUTRAL_EXTRA_LIGHT}>
      <View
        style={{
          gap: Spacings.sm,
          flex: 1,
        }}
      >
        <TextBold size="lg">Write Public Note</TextBold>
        {autoNote !== publicNote && (
          <View
            style={{
              padding: Spacings.xs,
              borderRadius: 8,
              backgroundColor: Colors.WARNING_EXTRA_LIGHT,
            }}
          >
            <TextRegular size="sm" color={Colors.WARNING_DARK}>
              You changed the form above. Please review note text for
              consistency.
            </TextRegular>
          </View>
        )}
        <TextRegular size="md">
          Use the generated text below to get started. When finished, click
          “Save Note.”
        </TextRegular>

        <View style={{ flexGrow: 1 }}>
          <TextInput
            value={publicNote}
            onChangeText={(text) => onChange(text)}
            multiline
            accessibilityHint="area to write an HMIS note"
            textAlignVertical="top"
            accessibilityLabel="HMIS input"
            style={styles.input}
          />
        </View>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: Colors.WHITE,
            padding: Spacings.sm,
            paddingTop: Spacings.xl,
            gap: Spacings.xs,
            elevation: 5,
            shadowColor: '#CCC',
            shadowOffset: { width: 0, height: -3 },
            shadowOpacity: 0.3,
            shadowRadius: 4,
          }}
        >
          <View
            style={{
              flex: 1,
            }}
          >
            <Button
              onPress={() => {
                if (autoNote !== publicNote) {
                  return setPublicNote(autoNote);
                }
                onChange('');
              }}
              height="xl"
              accessibilityHint="clears HMIS input"
              size="full"
              variant="secondary"
              title={autoNote !== publicNote ? 'Regenerate' : 'Clear'}
            />
          </View>

          <View style={{ flex: 1 }}>
            <Button
              onPress={() => router.back()}
              height="xl"
              accessibilityHint="clears HMIS input"
              size="full"
              variant="primary"
              title="Save Note"
            />
          </View>
        </View>
      </View>
    </MainScrollContainer>
  );
}

const styles = StyleSheet.create({
  input: {
    flex: 1,
    padding: Spacings.sm,
    fontFamily: 'Poppins-Regular',
    fontSize: 16,
    color: Colors.PRIMARY_EXTRA_DARK,
    backgroundColor: Colors.WHITE,
    borderColor: Colors.NEUTRAL_LIGHT,
    borderWidth: 1,
    borderRadius: 8,
    alignItems: 'center',
    flexDirection: 'row',
    maxWidth: 600,
  },
});
