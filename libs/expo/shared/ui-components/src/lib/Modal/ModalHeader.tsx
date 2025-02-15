import { PlusIcon } from '@monorepo/expo/shared/icons';
import { Colors, Spacings } from '@monorepo/expo/shared/static';
import { TextMedium } from '@monorepo/expo/shared/ui-components';
import { Pressable, View } from 'react-native';

interface IProps {
  title?: string | null;
  onClose: () => void;
  accessibilityHint?: string;
}

export function ModalHeader(props: IProps) {
  const { accessibilityHint, title, onClose } = props;

  return (
    <View
      style={{
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        width: '100%',
        backgroundColor: Colors.WHITE,
        paddingLeft: Spacings.sm,
        paddingRight: Spacings.sm,
        paddingBottom: Spacings.xxs,
      }}
    >
      {title && (
        <TextMedium
          textAlign="center"
          size="md"
          mr="xs"
          style={{
            flex: 1,
          }}
        >
          {title}
        </TextMedium>
      )}
      <Pressable
        onPress={onClose}
        style={{
          width: 40,
          height: 40,
          justifyContent: 'center',
          alignItems: 'center',
          marginLeft: 'auto',
        }}
        accessibilityHint={accessibilityHint || 'close'}
        accessibilityRole="button"
      >
        <PlusIcon size="md" color={Colors.BLACK} rotate="45deg" />
      </Pressable>
    </View>
  );
}
