import {
  Colors,
  Radiuses,
  Spacings,
  TMarginProps,
  getMarginStyles,
} from '@monorepo/expo/shared/static';
import { Pressable, StyleSheet, View, ViewStyle } from 'react-native';
import { ClientProfilesQuery } from '../../screens/Clients/__generated__/Clients.generated';
import { ClientCardBase } from './ClientCardBase';

type TClientProfile = ClientProfilesQuery['clientProfiles']['results'][number];

export interface IClientCardProps extends TMarginProps {
  client: TClientProfile | undefined;
  onPress?: (client: TClientProfile) => void;
  onMenuPress?: (client: TClientProfile) => void;
  style?: ViewStyle;
}

export function ClientCard(props: IClientCardProps) {
  const { client, onPress, style } = props;

  if (!client) {
    return null;
  }

  const wrapperStyle = [styles.container, style, getMarginStyles(props)];

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
