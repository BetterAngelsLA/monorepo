import {
  Accordion,
  CardWrapper,
  TextRegular,
} from '@monorepo/expo/shared/ui-components';
import { View } from 'react-native';
import { IProfileSectionProps } from './types';

export default function ImportantNotes(props: IProfileSectionProps) {
  const { expanded, setExpanded, client } = props;

  const isImportantNotes = expanded === 'Important Notes';

  return (
    <Accordion
      expanded={expanded}
      setExpanded={() => {
        setExpanded(isImportantNotes ? null : 'Important Notes');
      }}
      mb="xs"
      title="Important Notes"
    >
      {isImportantNotes && !!client?.clientProfile.importantNotes && (
        <View
          style={{
            height: isImportantNotes ? 'auto' : 0,
            overflow: 'hidden',
          }}
        >
          <CardWrapper>
            <TextRegular size="md">
              {client?.clientProfile.importantNotes}
            </TextRegular>
          </CardWrapper>
        </View>
      )}
    </Accordion>
  );
}
