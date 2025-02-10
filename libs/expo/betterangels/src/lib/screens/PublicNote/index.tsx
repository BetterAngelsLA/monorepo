import {
  Colors,
  FontSizes,
  Radiuses,
  Spacings,
} from '@monorepo/expo/shared/static';
import {
  Button,
  Loading,
  TextBold,
  TextRegular,
} from '@monorepo/expo/shared/ui-components';
import { debounce } from '@monorepo/expo/shared/utils';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
  const insets = useSafeAreaInsets();
  const bottomOffset = insets.bottom;

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
      purpose: data.note.purpose,
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
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: Colors.NEUTRAL_EXTRA_LIGHT,
        }}
      >
        <Loading size="large" />
      </View>
    );
  }

  return (
    <>
      <MainScrollContainer pb={Spacings.xl} bg={Colors.NEUTRAL_EXTRA_LIGHT}>
        <View
          style={{
            gap: Spacings.sm,
            flex: 1,
          }}
        >
          <TextBold size="lg">Write Note</TextBold>
          {autoNote !== publicNote && (
            <View
              style={{
                padding: Spacings.xs,
                borderRadius: Radiuses.xs,
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
              accessibilityHint="area to write a note"
              textAlignVertical="top"
              accessibilityLabel="Note input"
              style={styles.input}
              placeholder={
                "Describe your interaction or tap 'Regenerate' to automatically create it in GIRP format"
              }
            />
          </View>
        </View>
      </MainScrollContainer>
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
