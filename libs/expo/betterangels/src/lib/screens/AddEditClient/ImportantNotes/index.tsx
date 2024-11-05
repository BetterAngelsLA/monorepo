import { Spacings } from '@monorepo/expo/shared/static';
import { Accordion, Textarea } from '@monorepo/expo/shared/ui-components';
import { RefObject } from 'react';
import { useFormContext } from 'react-hook-form';
import { ScrollView, View } from 'react-native';
import {
  CreateClientProfileInput,
  UpdateClientProfileInput,
} from '../../../apollo';

interface IImportantNotesProps {
  expanded: undefined | string | null;
  setExpanded: (expanded: undefined | string | null) => void;
  scrollRef: RefObject<ScrollView>;
}

export default function ImportantNotes(props: IImportantNotesProps) {
  const { scrollRef, expanded, setExpanded } = props;
  const { control } = useFormContext<
    UpdateClientProfileInput | CreateClientProfileInput
  >();

  const isImportantNotes = expanded === 'Important Notes';
  return (
    <Accordion
      scrollRef={scrollRef}
      expanded={expanded}
      setExpanded={() => {
        setExpanded(isImportantNotes ? null : 'Important Notes');
      }}
      mb="xs"
      title="Important Notes"
    >
      {isImportantNotes && (
        <View
          style={{
            height: isImportantNotes ? 'auto' : 0,
            overflow: 'hidden',
            gap: Spacings.xs,
          }}
        >
          <Textarea
            placeholder="Enter important notes"
            name="importantNotes"
            control={control}
            height={200}
          />
        </View>
      )}
    </Accordion>
  );
}
