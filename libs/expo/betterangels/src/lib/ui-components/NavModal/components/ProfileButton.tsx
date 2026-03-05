import { Colors, Radiuses } from '@monorepo/expo/shared/static';
import { Avatar, TextRegular } from '@monorepo/expo/shared/ui-components';
import { StyleSheet, View } from 'react-native';
import { BaseButton } from './BaseButton';

type TProps = {
  onPress: () => void;
  image?: string;
  isHmisUser?: boolean;
};

export function ProfileButton(props: TProps) {
  const { onPress, image, isHmisUser } = props;

  return (
    <BaseButton onPress={onPress}>
      <BaseButton.Slot>
        <Avatar
          imageUrl={image}
          size="lg"
          accessibilityHint="my avatar"
          accessibilityLabel="My Avatar"
        />
      </BaseButton.Slot>

      <TextRegular color={Colors.PRIMARY_EXTRA_DARK}>Profile</TextRegular>

      {isHmisUser && (
        <View style={styles.profileTag}>
          <TextRegular size="sm" color={Colors.PRIMARY_EXTRA_DARK}>
            HMIS
          </TextRegular>
        </View>
      )}
    </BaseButton>
  );
}

const styles = StyleSheet.create({
  profileTag: {
    marginLeft: 'auto',
    backgroundColor: Colors.BRAND_SKY_BLUE,
    borderRadius: Radiuses.md,
    paddingVertical: 4,
    paddingHorizontal: 12,
  },
});
