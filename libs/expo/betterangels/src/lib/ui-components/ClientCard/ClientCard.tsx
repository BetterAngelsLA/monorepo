import {
  Colors,
  Radiuses,
  Spacings,
  TMarginProps,
  getMarginStyles,
} from '@monorepo/expo/shared/static';
import { toTestId } from '@monorepo/expo/shared/utils';
import { memo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useModalScreen } from '../../providers';
import { ClientProfilesQuery } from '../ClientProfileList/__generated__/ClientProfiles.generated';
import { ClientSummary } from '../ClientSummary';
import { CardMenuBtn } from './CardMenuBtn';
import { ClientCardBase } from './ClientCardBase';

type TClientProfile = ClientProfilesQuery['clientProfiles']['results'][number];

export interface IClientCardProps extends TMarginProps {
  client: TClientProfile | undefined;
  arrivedFrom?: string;
  type?: 'modal' | 'card';
  onMenuPress?: (client: TClientProfile) => void;
  // Parent-defined tap action; the clients list only passes one while the
  // referrals flag is on. Without it the card opens the legacy Profile Summary
  // modal — the flagged-off production path (OUT-203 tracks removing it).
  onPress?: () => void;
}

function ClientCardRaw(props: IClientCardProps) {
  const { client, arrivedFrom, type = 'modal', onMenuPress, onPress } = props;

  const { showModalScreen } = useModalScreen();

  if (!client) {
    return null;
  }

  const wrapperStyle = [styles.container, getMarginStyles(props)];

  // Rendered as a *sibling* of the tappable area, never a child of it:
  // `accessibilityRole="button"` becomes a real <button> on web, and a button
  // nested inside a button is invalid HTML (React reports a hydration error) and
  // a screen-reader problem. Native never cared, which is why this only shows up
  // on react-native-web.
  const menu = onMenuPress ? (
    <CardMenuBtn onPress={() => onMenuPress(client)} />
  ) : null;

  if (onPress || type === 'modal') {
    return (
      <View style={wrapperStyle}>
        <Pressable
          accessibilityRole="button"
          testID={toTestId(['client-card', client.firstName])}
          onPress={
            onPress ??
            (() =>
              showModalScreen({
                presentation: 'modal',
                title: 'Profile Summary',
                renderContent: () => (
                  <ClientSummary arrivedFrom={arrivedFrom} client={client} />
                ),
              }))
          }
          style={({ pressed }) => [
            styles.pressableArea,
            {
              backgroundColor: pressed ? Colors.GRAY_PRESSED : Colors.WHITE,
            },
          ]}
        >
          <ClientCardBase {...props} />
        </Pressable>
        {menu}
      </View>
    );
  }

  return (
    <View style={wrapperStyle}>
      <View style={styles.pressableArea}>
        <ClientCardBase {...props} />
      </View>
      {menu}
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
  /** The tappable region — a sibling of the menu button, not its parent. */
  pressableArea: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
});
