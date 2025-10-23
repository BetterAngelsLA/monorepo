import {
  Colors,
  FontSizes,
  Radiuses,
  Spacings,
} from '@monorepo/expo/shared/static';
import {
  Button,
  KeyboardAwareScrollView,
  TextBold,
  TextRegular,
} from '@monorepo/expo/shared/ui-components';
import { useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { generateGirpNote } from './generateGirpNote';

type TProps = {
  onDone: (note: string) => void;
  note?: string;
  disabled?: boolean;
  purpose?: string;
  providedServices?: string[];
  requestedServices?: string[];
};

export function GirpNoteForm(props: TProps) {
  const {
    note,
    onDone,
    purpose,
    providedServices,
    requestedServices,
    disabled,
  } = props;

  const [localNote, setLocalNote] = useState<string>(note || '');

  const insets = useSafeAreaInsets();
  const bottomOffset = insets.bottom;

  function generateNote() {
    const generated = generateGirpNote({
      purpose,
      providedServices,
      requestedServices,
    });

    setLocalNote(generated);
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
            “Done.”
          </TextRegular>

          <View style={{ flexGrow: 1 }}>
            <TextInput
              value={localNote}
              onChangeText={setLocalNote}
              multiline
              accessibilityHint="area to write a note"
              textAlignVertical="top"
              accessibilityLabel="Note input"
              style={styles.input}
              placeholder={
                'Tap “Generate” to auto-draft a note in GIRP format. When finished, tap Done.”'
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
              localNote ? setLocalNote('') : generateNote();
            }}
            height="xl"
            accessibilityHint={
              localNote ? 'Clears GIRP note' : 'Generates GIRP note'
            }
            size="full"
            variant="secondary"
            title={(!!localNote && 'Clear') || 'Generate'}
          />
        </View>

        <View style={{ flex: 1 }}>
          <Button
            disabled={disabled || !localNote.trim().length}
            onPress={() => onDone(localNote.trim())}
            height="xl"
            accessibilityHint="clears HMIS input"
            size="full"
            variant="primary"
            title="Done"
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
