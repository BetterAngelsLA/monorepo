import {
  Colors,
  Radiuses,
  Spacings,
  TMarginProps,
  getMarginStyles,
} from '@monorepo/expo/shared/static';
import { memo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useModalScreen } from '../../providers';
import { ClientProfilesQuery } from '../ClientProfileList/__generated__/ClientProfiles.generated';
import { ClientSummary } from '../ClientSummary';
import { ClientCardBase } from './ClientCardBase';

type TClientProfile = ClientProfilesQuery['clientProfiles']['results'][number];

export interface IClientCardProps extends TMarginProps {
  client: TClientProfile | undefined;
  arrivedFrom?: string;
  type?: 'modal' | 'card';
  onMenuPress?: (client: TClientProfile) => void;
}

function ClientCardRaw(props: IClientCardProps) {
  const { client, arrivedFrom, type = 'modal' } = props;

  const { showModalScreen } = useModalScreen();

  if (!client) {
    return null;
  }

  const wrapperStyle = [styles.container, getMarginStyles(props)];

  if (type === 'modal') {
    return (
      <Pressable
        accessibilityRole="button"
        onPress={() =>
          showModalScreen({
            presentation: 'modal',
            title: 'Profile Summary',
            renderContent: () => (
              <ClientSummary arrivedFrom={arrivedFrom} client={client} />
            ),
          })
        }
        style={({ pressed }) => [
          wrapperStyle,
          {
            backgroundColor: pressed ? Colors.GRAY_PRESSED : Colors.WHITE,
          },
        ]}
      >
        <ClientCardBase {...props} />
      </Pressable>
    );
  }

  return (
    <View style={wrapperStyle}>
      <ClientCardBase {...props} />
    </View>
  );
}

export const ClientCard = memo(ClientCardRaw);

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    borderRadius: Radiuses.xs,
    padding: Spacings.xs,
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: Colors.WHITE,
  },
});
