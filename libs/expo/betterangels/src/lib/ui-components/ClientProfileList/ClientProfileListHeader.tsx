import { Colors } from '@monorepo/expo/shared/static';
import { TextButton, TextRegular } from '@monorepo/expo/shared/ui-components';
import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';

type TProps = {
  visibleClients: number;
  totalClients: number;
  showAllClientsLink?: boolean;
  renderHeaderText?: (params: {
    totalClients: number;
    visibleClients: number;
  }) => string;
};

export function ClientProfileListHeader(props: TProps) {
  const { visibleClients, totalClients, renderHeaderText, showAllClientsLink } =
    props;

  const router = useRouter();

  const headerText =
    typeof renderHeaderText === 'function'
      ? renderHeaderText({ totalClients, visibleClients })
      : `Showing ${visibleClients} of ${totalClients} clients`;

  return (
    <View style={styles.container}>
      <TextRegular>{headerText}</TextRegular>

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
    backgroundColor: Colors.NEUTRAL_EXTRA_LIGHT,
  },
});
