import { Colors, Spacings } from '@monorepo/expo/shared/static';
import { View } from 'react-native';
import CloseButton from '../CloseButton';
import TextMedium from '../TextMedium';

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
      <CloseButton
        onClose={onClose}
        accessibilityHint={accessibilityHint || 'close'}
      />
    </View>
  );
}
