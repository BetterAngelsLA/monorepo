import { Colors, Spacings } from '@monorepo/expo/shared/static';
import { Dispatch, SetStateAction } from 'react';
import { View } from 'react-native';
import Button from '../Button';
import TextButton from '../TextButton';

export default function ActionModalFooter({
  onPrimaryPress,
  onSecondaryPress,
  onTertiaryPress,
  secondaryButtonTitle,
  tertiaryButtonTitle,
  primaryButtonTitle,
  setVisible,
}: {
  onPrimaryPress: () => void;
  onSecondaryPress?: () => void;
  onTertiaryPress?: () => void;
  secondaryButtonTitle?: string;
  tertiaryButtonTitle?: string;
  primaryButtonTitle: string;
  setVisible: Dispatch<SetStateAction<boolean>>;
}) {
  const handleSecondaryPress = () => {
    if (onSecondaryPress) {
      onSecondaryPress();
    }
    setVisible(false);
  };
  const handleTertiaryPress = () => {
    if (onTertiaryPress) {
      onTertiaryPress();
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
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        {!!secondaryButtonTitle && (
          <View
            style={{
              alignItems: 'center',
              justifyContent: 'center',
              paddingHorizontal: Spacings.sm,
            }}
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
        {!!tertiaryButtonTitle && (
          <View
            style={{
              alignItems: 'center',
              justifyContent: 'center',
              paddingHorizontal: Spacings.sm,
            }}
          >
            <TextButton
              testId="action-modal-tertiary"
              fontSize="sm"
              onPress={handleTertiaryPress}
              color={Colors.ERROR}
              accessibilityHint="destructive alternative"
              title={tertiaryButtonTitle}
            />
          </View>
        )}
      </View>
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
