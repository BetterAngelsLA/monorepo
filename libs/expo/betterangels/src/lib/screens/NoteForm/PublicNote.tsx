import {
  Colors,
  FontSizes,
  Radiuses,
  Spacings,
} from '@monorepo/expo/shared/static';
import {
  Button,
  FieldCard,
  TextRegular,
} from '@monorepo/expo/shared/ui-components';
import { RefObject, useState } from 'react';
import { ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ViewNoteQuery } from '../../apollo';
import { generatePublicNote } from '../../helpers';
import { useModalScreen } from '../../providers';
import { MainScrollContainer } from '../../ui-components';

interface IPublicNoteProps {
  note: string;
  scrollRef: RefObject<ScrollView | null>;
  onPublicNoteChange: (text: string) => void;
  purpose?: string | null;
  providedServices?: ViewNoteQuery['note']['providedServices'];
  requestedServices?: ViewNoteQuery['note']['requestedServices'];
}

export default function PublicNote(props: IPublicNoteProps) {
  const {
    note,
    scrollRef,
    onPublicNoteChange,
    purpose,
    providedServices,
    requestedServices,
  } = props;

  const { showModalScreen } = useModalScreen();

  const openModal = () => {
    showModalScreen({
      presentation: 'modal',
      title: 'Write Note',
      renderContent: ({ close }) => (
        <PublicNoteModalContent
          initialText={note}
          purpose={purpose}
          providedServices={providedServices}
          requestedServices={requestedServices}
          onSave={(text) => {
            onPublicNoteChange(text);
            close();
          }}
        />
      ),
    });
  };

  return (
    <FieldCard
      scrollRef={scrollRef}
      mb="xs"
      setExpanded={openModal}
      title="Note"
      actionName={null}
    >
      {note ? <TextRegular mb="md">{note}</TextRegular> : null}
    </FieldCard>
  );
}

// ── Modal Content ────────────────────────────────────────────────────────

interface IPublicNoteModalContentProps {
  initialText: string;
  purpose?: string | null;
  providedServices?: ViewNoteQuery['note']['providedServices'];
  requestedServices?: ViewNoteQuery['note']['requestedServices'];
  onSave: (text: string) => void;
}

function PublicNoteModalContent(props: IPublicNoteModalContentProps) {
  const { initialText, purpose, providedServices, requestedServices, onSave } =
    props;

  const [draftText, setDraftText] = useState(initialText || '');
  const { bottom: bottomInset } = useSafeAreaInsets();

  const handleGenerate = () => {
    const autoNote = generatePublicNote({
      purpose: purpose || '',
      providedServices: providedServices || [],
      requestedServices: requestedServices || [],
    });
    setDraftText(autoNote);
  };

  const handleClear = () => {
    setDraftText('');
  };

  return (
    <View style={styles.container}>
      <MainScrollContainer keyboardAware px="sm" pt="sm">
        <TextRegular mb="sm">
          Use the generated text below to get started. When finished, tap "Save
          Note."
        </TextRegular>

        <TextInput
          value={draftText}
          onChangeText={setDraftText}
          multiline
          accessibilityHint="area to write a note"
          textAlignVertical="top"
          accessibilityLabel="Note input"
          style={styles.input}
          placeholder={
            'Tap "Generate" to auto-draft a note in GIRP format. When finished, tap "Save Note."'
          }
        />
      </MainScrollContainer>

      <View
        style={[styles.bottomBar, { paddingBottom: bottomInset + Spacings.lg }]}
      >
        <View style={{ flex: 1 }}>
          <Button
            onPress={draftText ? handleClear : handleGenerate}
            size="full"
            variant="secondary"
            title={draftText ? 'Clear' : 'Generate'}
            accessibilityHint="Generates or clears GIRP note"
          />
        </View>
        <View style={{ flex: 1 }}>
          <Button
            onPress={() => onSave(draftText)}
            size="full"
            variant="primary"
            title="Save Note"
            accessibilityHint="saves the note and returns to the form"
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.WHITE,
  },
  input: {
    flex: 1,
    minHeight: 200,
    padding: Spacings.sm,
    fontFamily: 'Poppins-Regular',
    fontSize: FontSizes.md.fontSize,
    color: Colors.PRIMARY_EXTRA_DARK,
    backgroundColor: Colors.WHITE,
    borderColor: Colors.NEUTRAL_LIGHT,
    borderWidth: 1,
    borderRadius: Radiuses.xs,
  },
  bottomBar: {
    flexDirection: 'row',
    gap: Spacings.xs,
    width: '100%',
    paddingTop: Spacings.sm,
    alignItems: 'center',
    paddingHorizontal: Spacings.md,
    backgroundColor: Colors.WHITE,
    shadowColor: Colors.BLACK,
    shadowOffset: { width: 0, height: -5 },
    shadowOpacity: 0.05,
    shadowRadius: 3.84,
    elevation: 1,
  },
});
