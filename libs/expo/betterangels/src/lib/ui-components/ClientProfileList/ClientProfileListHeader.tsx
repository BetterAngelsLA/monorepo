import {
  Colors,
  TMarginProps,
  getMarginStyles,
} from '@monorepo/expo/shared/static';
import { TextButton, TextMedium } from '@monorepo/expo/shared/ui-components';
import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';

interface IProps extends TMarginProps {
  visibleClients: number;
  totalClients: number;
  showAllClientsLink?: boolean;
  renderHeader?: ({
    totalClients,
    visibleClients,
  }: {
    totalClients: number;
    visibleClients: number;
  }) => string;
}

export function ClientProfileListHeader(props: IProps) {
  const { visibleClients, totalClients, renderHeader, showAllClientsLink } =
    props;

  const router = useRouter();

  return (
    <View style={[styles.container, { ...getMarginStyles(props) }]}>
      {renderHeader && (
        <TextMedium size="sm">
          {/* display dynamic text here */}
          Displaying {visibleClients} of {totalClients} Active Clients
          {/* {renderHeader} */}
        </TextMedium>
      )}

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
