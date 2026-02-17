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
import { RefObject, useEffect, useState } from 'react';
import { ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { ViewNoteQuery } from '../../apollo';
import { generatePublicNote } from '../../helpers';

interface IPublicNoteProps {
  expanded: string | undefined | null;
  setExpanded: (expanded: string | undefined | null) => void;
  isPublicNoteEdited: boolean;
  setIsPublicNoteEdited: (isPublicNoteEdited: boolean) => void;
  note: string;
  noteId: string;
  scrollRef: RefObject<ScrollView | null>;
  onPublicNoteChange: (text: string) => void;
  purpose?: string | null;
  providedServices?: ViewNoteQuery['note']['providedServices'];
  requestedServices?: ViewNoteQuery['note']['requestedServices'];
}

const FIELD_KEY = 'PublicNote';

export default function PublicNote(props: IPublicNoteProps) {
  const {
    expanded,
    setExpanded,
    note,
    scrollRef,
    onPublicNoteChange,
    purpose,
    providedServices,
    requestedServices,
  } = props;

  const isExpanded = expanded === FIELD_KEY;
  const [localText, setLocalText] = useState(note || '');

  useEffect(() => {
    setLocalText(note || '');
  }, [note]);

  const handleGenerate = () => {
    const autoNote = generatePublicNote({
      purpose: purpose || '',
      providedServices: providedServices || [],
      requestedServices: requestedServices || [],
    });
    setLocalText(autoNote);
    onPublicNoteChange(autoNote);
  };

  const handleClear = () => {
    setLocalText('');
    onPublicNoteChange('');
  };

  const handleTextChange = (text: string) => {
    setLocalText(text);
    onPublicNoteChange(text);
  };

  return (
    <FieldCard
      scrollRef={scrollRef}
      expanded={expanded}
      mb="xs"
      setExpanded={() => setExpanded(isExpanded ? undefined : FIELD_KEY)}
      title="Note"
      actionName={
        !isExpanded && note ? (
          <TextRegular size="sm" numberOfLines={1}>
            {note.substring(0, 50)}
            {note.length > 50 ? '...' : ''}
          </TextRegular>
        ) : null
      }
    >
      {isExpanded && (
        <View style={{ gap: Spacings.sm, paddingBottom: Spacings.md }}>
          <TextInput
            value={localText}
            onChangeText={handleTextChange}
            multiline
            accessibilityHint="area to write a note"
            textAlignVertical="top"
            accessibilityLabel="Note input"
            style={styles.input}
            placeholder='Tap "Generate" to auto-draft a note in GIRP format.'
          />
          <View style={{ flexDirection: 'row', gap: Spacings.xs }}>
            <View style={{ flex: 1 }}>
              <Button
                onPress={localText ? handleClear : handleGenerate}
                height="md"
                accessibilityHint="Generates or clears GIRP note"
                size="full"
                variant="secondary"
                title={localText ? 'Clear' : 'Generate'}
              />
            </View>
          </View>
        </View>
      )}
      {!isExpanded && note ? <TextRegular mb="md">{note}</TextRegular> : null}
    </FieldCard>
  );
}

const styles = StyleSheet.create({
  input: {
    minHeight: 120,
    padding: Spacings.sm,
    fontFamily: 'Poppins-Regular',
    fontSize: FontSizes.md.fontSize,
    color: Colors.PRIMARY_EXTRA_DARK,
    backgroundColor: Colors.WHITE,
    borderColor: Colors.NEUTRAL_LIGHT,
    borderWidth: 1,
    borderRadius: Radiuses.xs,
  },
});
