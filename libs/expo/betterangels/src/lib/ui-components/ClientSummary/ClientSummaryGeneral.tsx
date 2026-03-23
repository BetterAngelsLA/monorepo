import { useQuery } from '@apollo/client/react';
import {
  CakeIcon,
  CallOutlinedIcon,
  ExternalLinkOutlinedIcon,
  GlobeIcon,
  ListIcon,
  WarningIcon,
} from '@monorepo/expo/shared/icons';
import { Colors, Spacings } from '@monorepo/expo/shared/static';
import {
  PressablePanel,
  TextBold,
  TextRegular,
} from '@monorepo/expo/shared/ui-components';
import { formatPhoneNumber } from '@monorepo/expo/shared/utils';
import { format } from 'date-fns';
import { router } from 'expo-router';
import { Linking, View } from 'react-native';
import { TaskStatusEnum } from '../../apollo';
import { ClientViewTabEnum } from '../../screens/Client/ClientTabs';
import { enumLanguageCode } from '../../static';
import { ClientProfilesQuery } from '../ClientProfileList/__generated__/ClientProfiles.generated';
import { TasksDocument } from '../TaskList/__generated__/Tasks.generated';
import { PressablePanelContainer } from './PressablePanelContainer';

interface IClientSummaryGeneralProps {
  client: ClientProfilesQuery['clientProfiles']['results'][number];
  arrivedFrom?: string;
}

export default function ClientSummaryGeneral(
  props: IClientSummaryGeneralProps
) {
  const { client, arrivedFrom } = props;

  const { data, loading } = useQuery(TasksDocument, {
    variables: {
      filters: {
        clientProfile: client.id,
        status: [TaskStatusEnum.InProgress, TaskStatusEnum.ToDo],
      },
      pagination: {
        offset: 0,
        limit: 0,
      },
    },
    notifyOnNetworkStatusChange: true,
  });
  const primaryPhoneNumber = client.phoneNumbers?.find(
    (item) => item.isPrimary
  )?.number;

  const formattedNumber =
    primaryPhoneNumber && formatPhoneNumber(primaryPhoneNumber);

  const [phoneNumber, extension] = primaryPhoneNumber || [];

  const phoneNumberUrl = extension
    ? `${phoneNumber},${extension}`
    : phoneNumber;

  const total = data?.tasks.totalCount || 0;

  return (
    <View style={{ gap: Spacings.xs }}>
      <View
        style={{
          flexDirection: 'row',
          gap: Spacings.xs,
          flex: 1,
        }}
      >
        <PressablePanelContainer
          flex={3}
          title={
            client.dateOfBirth
              ? format(new Date(client.dateOfBirth), 'MM/dd/yy')
              : 'N/A'
          }
          subtitle="DOB"
          icon={<CakeIcon color={Colors.PRIMARY} />}
        />
        <PressablePanelContainer
          flex={2}
          title={
            client.preferredLanguage
              ? enumLanguageCode[client.preferredLanguage]
              : 'N/A'
          }
          subtitle="LANGUAGE"
          icon={<GlobeIcon color={Colors.PRIMARY} />}
        />
      </View>
      <View style={{ flexDirection: 'row', gap: Spacings.xs }}>
        <PressablePanelContainer
          onPress={() => Linking.openURL(`tel:${phoneNumberUrl}`)}
          disabled={!phoneNumberUrl}
          flex={3}
          title={formattedNumber || 'N/A'}
          extension={extension}
          subtitle="CONTACT"
          icon={<CallOutlinedIcon color={Colors.PRIMARY} />}
          actionIcon={
            formattedNumber && (
              <ExternalLinkOutlinedIcon color={Colors.PRIMARY} />
            )
          }
        />
        <PressablePanelContainer
          onPress={() =>
            router.navigate({
              pathname: `/client/${client.id}`,
              params: { newTab: ClientViewTabEnum.Tasks, arrivedFrom },
            })
          }
          disabled={!total}
          flex={2}
          title={loading ? '' : total.toString() || '0'}
          subtitle="TASKS"
          icon={<ListIcon color={Colors.WARNING_DARK} />}
          variant="warning"
          actionIcon={
            total > 0 && (
              <ExternalLinkOutlinedIcon color={Colors.WARNING_DARK} />
            )
          }
        />
      </View>
      {client.importantNotes && (
        <PressablePanel style={{ marginTop: Spacings.sm }} variant="error">
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: Spacings.xs,
              marginBottom: Spacings.xxs,
            }}
          >
            <View
              style={{
                height: 30,
                width: 30,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: Colors.WHITE,
                borderRadius: 100,
              }}
            >
              <WarningIcon color={Colors.ERROR} />
            </View>
            <TextBold size="sm" color={Colors.ERROR_DARK}>
              Important Note
            </TextBold>
          </View>
          <TextRegular color={Colors.ERROR_DARK}>
            {client.importantNotes}
          </TextRegular>
        </PressablePanel>
      )}
    </View>
  );
}
