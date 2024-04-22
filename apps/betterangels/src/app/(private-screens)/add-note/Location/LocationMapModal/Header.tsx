import { Colors, Spacings } from '@monorepo/expo/shared/static';
import { BodyText, H4 } from '@monorepo/expo/shared/ui-components';
import { Pressable, View } from 'react-native';

interface IHeaderProps {
  closeModal: (hasLocation: boolean) => void;
}

export default function Header(props: IHeaderProps) {
  const { closeModal } = props;
  return (
    <View
      style={{
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'space-between',
        backgroundColor: Colors.WHITE,
        paddingHorizontal: Spacings.sm,
        paddingTop: Spacings.sm,
        paddingBottom: Spacings.xs,
        borderBottomWidth: 0.5,
        borderBottomColor: Colors.NEUTRAL_LIGHT,
      }}
    >
      <Pressable
        style={{ marginRight: Spacings.xs, flex: 1 }}
        accessibilityRole="button"
        onPress={() => closeModal(false)}
        accessibilityHint="close map modal"
      >
        <BodyText size="sm">Back</BodyText>
      </Pressable>
      <H4
        align="center"
        style={{
          flex: 2,
        }}
      >
        Type or Pin Location
      </H4>
      <View style={{ flex: 1 }} />
    </View>
  );
}
