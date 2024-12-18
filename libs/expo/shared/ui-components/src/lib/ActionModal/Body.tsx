import { Colors, Spacings } from '@monorepo/expo/shared/static';
import { Dispatch, SetStateAction } from 'react';
import { View } from 'react-native';
import Button from '../Button';
import TextButton from '../TextButton';

export default function ActionModalBody({
  onPrimaryPress,
  onSecondaryPress,
  secondaryButtonTitle,
  primaryButtonTitle,
  setVisible,
}: {
  onPrimaryPress: () => void;
  onSecondaryPress?: () => void;
  secondaryButtonTitle?: string;
  primaryButtonTitle: string;
  setVisible: Dispatch<SetStateAction<boolean>>;
}) {
  const handleSecondaryPress = () => {
    if (onSecondaryPress) {
      onSecondaryPress();
    }
    setVisible(false);
  };
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: Spacings.sm,
        gap: Spacings.xs,
      }}
    >
      {secondaryButtonTitle && (
        <View
          style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
        >
          <TextButton
            fontSize="sm"
            onPress={handleSecondaryPress}
            color={Colors.PRIMARY}
            accessibilityHint="cancel button"
            title={secondaryButtonTitle}
          />
        </View>
      )}
      <View style={{ flex: 1 }}>
        <Button
          size="full"
          fontSize="sm"
          accessibilityHint="proceed button"
          onPress={onPrimaryPress}
          variant="primary"
          title={primaryButtonTitle}
        />
      </View>
    </View>
  );
}
