import { Colors } from '@monorepo/expo/shared/static';
import { TextButton, TextMedium } from '@monorepo/expo/shared/ui-components';
import { useRouter } from 'expo-router';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';

type TProps = {
  visibleClients: number;
  totalClients: number;
  style?: StyleProp<ViewStyle>;
  showAllClientsLink?: boolean;
  renderHeaderText?: (params: {
    totalClients: number;
    visibleClients: number;
  }) => string;
};

export function ClientProfileListHeader(props: TProps) {
  const {
    visibleClients,
    totalClients,
    renderHeaderText,
    showAllClientsLink,
    style,
  } = props;

  const router = useRouter();

  const headerText =
    typeof renderHeaderText === 'function'
      ? renderHeaderText({ totalClients, visibleClients })
      : `Displaying ${visibleClients} of ${totalClients} clients`;

  return (
    <View style={[styles.container, style]}>
      <TextMedium size="sm">{headerText}</TextMedium>

      {showAllClientsLink && (
        <TextButton
          accessibilityHint="goes to all clients list"
          color={Colors.PRIMARY}
          fontSize="sm"
          regular={true}
          title="All Clients"
          onPress={() => router.navigate('/clients')}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
});
