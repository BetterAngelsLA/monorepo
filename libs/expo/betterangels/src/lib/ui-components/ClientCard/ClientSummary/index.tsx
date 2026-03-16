import { Colors, Spacings } from '@monorepo/expo/shared/static';
import { Button } from '@monorepo/expo/shared/ui-components';
import { router } from 'expo-router';
import { useCallback } from 'react';
import { ScrollView, View } from 'react-native';
import { useUserTeamPreference } from '../../../state';
import { ClientProfilesQuery } from '../../ClientProfileList/__generated__/ClientProfiles.generated';
import MainScrollContainer from '../../MainScrollContainer';
import ClientSummaryContact from './ClientSummaryContact';
import ClientSummaryGeneral from './ClientSummaryGeneral';
import ClientSummaryHeader from './ClientSummaryHeader';
import ClientSummaryIdentity from './ClientSummaryIdentity';
import ClientSummaryLastSeen from './ClientSummaryLastSeen';

interface IClientSummaryProps {
  client: ClientProfilesQuery['clientProfiles']['results'][number];
  arrivedFrom?: string;
}

export function ClientSummary(props: IClientSummaryProps) {
  const { client, arrivedFrom } = props;
  const [teamPreference] = useUserTeamPreference();

  const handleClientPress = useCallback(
    (id: string) => {
      router.replace({
        pathname: `/client/${id}`,
        params: { arrivedFrom },
      });
    },
    [arrivedFrom]
  );

  const handleNavigateToNewNote = useCallback(() => {
    const params: Record<string, string> = {
      clientProfileId: client.id,
    };
    if (teamPreference) {
      params.team = teamPreference;
    }

    if (arrivedFrom) {
      params.arrivedFrom = arrivedFrom;
    }

    router.replace({
      pathname: '/note/create',
      params,
    });
  }, [client.id, teamPreference, arrivedFrom]);

  return (
    <View style={{ flex: 1, backgroundColor: Colors.WHITE }}>
      <MainScrollContainer keyboardAware>
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            gap: Spacings.sm,
          }}
          style={{ paddingHorizontal: Spacings.xs }}
        >
          <ClientSummaryHeader client={client} />
          <ClientSummaryGeneral arrivedFrom={arrivedFrom} client={client} />
          <ClientSummaryLastSeen client={client} />
          <ClientSummaryContact client={client} />
          <ClientSummaryIdentity client={client} />
        </ScrollView>
      </MainScrollContainer>

      <View
        style={{
          flexDirection: 'row',
          gap: Spacings.xs,
          width: '100%',
          paddingVertical: Spacings.sm,
          alignItems: 'center',
          paddingHorizontal: Spacings.md,
          backgroundColor: Colors.WHITE,
          shadowColor: Colors.BLACK,
          shadowOffset: { width: 0, height: -5 },
          shadowOpacity: 0.05,
          shadowRadius: 3.84,
          elevation: 1,
        }}
      >
        <View style={{ flex: 1 }}>
          <Button
            onPress={handleNavigateToNewNote}
            size="full"
            variant="secondary"
            title="Add Interaction"
            accessibilityHint="Add interaction for the client"
          />
        </View>
        <View style={{ flex: 1 }}>
          <Button
            onPress={() => handleClientPress(client.id)}
            size="full"
            variant="primary"
            title="See Details"
            accessibilityHint="see client details"
          />
        </View>
      </View>
    </View>
  );
}
