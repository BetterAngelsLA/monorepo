import { Colors, Spacings } from '@monorepo/expo/shared/static';
import { Avatar, TextRegular } from '@monorepo/expo/shared/ui-components';
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { NoteType } from '../../apollo';
import { useClientProfilesQuery } from '../../screens/Home/__generated__/ActiveClients.generated';

interface INoteCardClientProps {
  clientProfile?: NoteType['clientProfile'];
  createdBy: NoteType['createdBy'];
  isOnInteractionsPage: boolean;
  isSubmitted: boolean;
}

export default function NoteCardClient(props: INoteCardClientProps) {
  const { clientProfile, createdBy, isOnInteractionsPage, isSubmitted } = props;
  const displayDetails = isOnInteractionsPage ? clientProfile : createdBy;
  const paginationLimit = 20;
  const clientId = (displayDetails && isOnInteractionsPage)?clientProfile?.id:undefined;
  const [clientPhoto, setClientPhoto] = useState<string>("");
  const { data, loading } = useClientProfilesQuery({
    variables: {
      filters: { isActive: true },
      pagination: { limit: paginationLimit },
    },
    fetchPolicy: 'cache-and-network',
    nextFetchPolicy: 'cache-first',
  });

  useEffect(() => {
    if (!data || !('clientProfiles' in data)) {
      console.log("No data?");
      return;
    }
    const { results, totalCount } = data.clientProfiles;
    const fullClientProfile = results.find(item => item.id === clientId);
    setClientPhoto(fullClientProfile?.profilePhoto?.url||"");

  }, []);

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
        }}
      >
        <Avatar
          mr="xs"
          size="sm"
          accessibilityLabel={displayDetails?.email || 'unknown user'}
          accessibilityHint={
            `${displayDetails?.email} client's avatar` || `client's avatar`
          }
          imageUrl={clientPhoto}
        />
        <TextRegular size="sm" color={Colors.PRIMARY_EXTRA_DARK}>
          {displayDetails?.firstName} {displayDetails?.lastName}
        </TextRegular>
      </View>
      {!isSubmitted && (
        <View
          style={{
            backgroundColor: Colors.PRIMARY_EXTRA_LIGHT,
            paddingHorizontal: Spacings.xxs,
            borderRadius: 20,
          }}
        >
          <TextRegular size="sm" color={Colors.NEUTRAL_EXTRA_DARK}>
            Draft
          </TextRegular>
        </View>
      )}
    </View>
  );
}
