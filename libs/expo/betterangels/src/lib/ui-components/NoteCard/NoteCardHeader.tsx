import { NoteIcon } from '@monorepo/expo/shared/icons';
import { Colors, Spacings } from '@monorepo/expo/shared/static';
import { BodyText } from '@monorepo/expo/shared/ui-components';
import { format } from 'date-fns';
import { View } from 'react-native';

interface INoteCardHeaderProps {
  title: string;
  interactedAt: string;
  isSubmitted: boolean;
}

export default function NoteCardHeader(props: INoteCardHeaderProps) {
  const { isSubmitted, title, interactedAt } = props;
  return (
    <View
      style={{
        justifyContent: 'space-between',
        flexDirection: 'row',
      }}
    >
      <View style={{ flexDirection: 'row', flex: 2 }}>
        <NoteIcon mr="xs" color={Colors.NEUTRAL_DARK} />
        <BodyText
          numberOfLines={2}
          ellipsizeMode="tail"
          size="sm"
          color={Colors.NEUTRAL_DARK}
        >
          {title}
        </BodyText>
      </View>
      <View style={{ alignItems: 'flex-end', flex: 1 }}>
        <BodyText size="sm" color={Colors.NEUTRAL_DARK}>
          {format(new Date(interactedAt), 'MM/dd/yyyy')}
        </BodyText>
        {!isSubmitted && (
          <View
            style={{
              marginTop: Spacings.xs,
              backgroundColor: Colors.PRIMARY_EXTRA_LIGHT,
              paddingHorizontal: 4,
              borderRadius: 20,
            }}
          >
            <BodyText size="sm" color={Colors.NEUTRAL_EXTRA_DARK}>
              Draft
            </BodyText>
          </View>
        )}
      </View>
    </View>
  );
}
