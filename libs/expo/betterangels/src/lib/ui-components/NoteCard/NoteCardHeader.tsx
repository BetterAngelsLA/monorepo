import { NoteIcon } from '@monorepo/expo/shared/icons';
import { Colors } from '@monorepo/expo/shared/static';
import { TextRegular } from '@monorepo/expo/shared/ui-components';
import { format } from 'date-fns';
import { View } from 'react-native';

interface INoteCardHeaderProps {
  purpose: string | null | undefined;
  interactedAt: string;
}

export default function NoteCardHeader(props: INoteCardHeaderProps) {
  const { purpose, interactedAt } = props;
  return (
    <View
      style={{
        justifyContent: 'space-between',
        flexDirection: 'row',
        alignItems: 'center',
      }}
    >
      <View
        style={{
          flexDirection: 'row',
          flex: 2,
          alignItems: 'center',
        }}
      >
        <NoteIcon mr="xs" color={Colors.NEUTRAL_DARK} />
        <TextRegular
          numberOfLines={2}
          ellipsizeMode="tail"
          size="sm"
          color={Colors.NEUTRAL_DARK}
        >
          {purpose}
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
