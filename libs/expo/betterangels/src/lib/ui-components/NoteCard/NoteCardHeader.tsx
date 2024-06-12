import { NoteIcon } from '@monorepo/expo/shared/icons';
import { Colors } from '@monorepo/expo/shared/static';
import { TextRegular } from '@monorepo/expo/shared/ui-components';
import { format } from 'date-fns';
import { View } from 'react-native';

interface INoteCardHeaderProps {
  title: string;
  interactedAt: string;
}

export default function NoteCardHeader(props: INoteCardHeaderProps) {
  const { title, interactedAt } = props;
  return (
    <View
      style={{
        justifyContent: 'space-between',
        flexDirection: 'row',
      }}
    >
      <View style={{ flexDirection: 'row', flex: 2 }}>
        <NoteIcon mr="xs" color={Colors.NEUTRAL_DARK} />
        <TextRegular
          numberOfLines={2}
          ellipsizeMode="tail"
          size="sm"
          color={Colors.NEUTRAL_DARK}
        >
          {title}
        </TextRegular>
      </View>
      <View style={{ alignItems: 'flex-end', flex: 1 }}>
        <TextRegular size="sm" color={Colors.NEUTRAL_DARK}>
          {format(new Date(interactedAt), 'MM/dd/yyyy')}
        </TextRegular>
      </View>
    </View>
  );
}
