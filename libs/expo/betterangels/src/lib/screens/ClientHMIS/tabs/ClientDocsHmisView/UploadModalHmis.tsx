import { PlusIcon } from '@monorepo/expo/shared/icons';
import { Colors, Spacings } from '@monorepo/expo/shared/static';
import { TextBold, TextRegular } from '@monorepo/expo/shared/ui-components';
import { Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { HmisClientProfileType } from '../../../../apollo';

export default function UploadModalHmis(props: {
  client: HmisClientProfileType;
  closeModal: () => void;
}) {
  const { client, closeModal } = props;

  const insets = useSafeAreaInsets();
  const bottomOffset = insets.bottom;
  const topOffset = insets.top;

  return (
    <View
      style={{
        paddingTop: topOffset + Spacings.xs,
        backgroundColor: Colors.WHITE,
        flex: 1,
      }}
    >
      <ScrollView
        style={{
          paddingHorizontal: Spacings.sm,
          paddingBottom: 35 + bottomOffset,
        }}
      >
        <Pressable
          style={{ marginLeft: 'auto' }}
          accessible
          accessibilityHint="closes the Upload modal"
          accessibilityRole="button"
          accessibilityLabel="close"
          onPress={closeModal}
        >
          <PlusIcon size="sm" color={Colors.BLACK} rotate="45deg" />
        </Pressable>

        <TextBold mb="xxs" mt="sm" size="lg">
          Upload Files
        </TextBold>

        <TextRegular size="sm" mb="md">
          Select the right file category and predefined name.
        </TextRegular>
        <View style={{ gap: Spacings.xs, marginBottom: Spacings.lg }}></View>
      </ScrollView>
    </View>
  );
}
