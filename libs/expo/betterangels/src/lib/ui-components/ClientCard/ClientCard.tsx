import {
  Colors,
  Radiuses,
  Spacings,
  TMarginProps,
  getMarginStyles,
} from '@monorepo/expo/shared/static';
import { memo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { ClientProfilesQuery } from '../../screens/Clients/__generated__/Clients.generated';
import { ClientCardBase } from './ClientCardBase';

type TClientProfile = ClientProfilesQuery['clientProfiles']['results'][number];

export interface IClientCardProps extends TMarginProps {
  client: TClientProfile | undefined;
  onPress?: (client: TClientProfile) => void;
  onMenuPress?: (client: TClientProfile) => void;
}

function ClientCardRaw(props: IClientCardProps) {
  const { client, onPress } = props;

  if (!client) {
    return null;
  }

  const wrapperStyle = [styles.container, getMarginStyles(props)];

  if (!onPress) {
    return (
      <View style={wrapperStyle}>
        <ClientCardBase {...props} />
      </View>
    );
  }

  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => onPress(client)}
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

export const ClientCard = memo(ClientCardRaw, (prev, next) => {
  return (
    prev.client?.id === next.client?.id &&
    prev.onPress === next.onPress &&
    prev.onMenuPress === next.onMenuPress
  );
});

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
