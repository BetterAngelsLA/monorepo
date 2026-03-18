import { useInfiniteScrollQuery } from '@monorepo/apollo';
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
  Panel,
  TextBold,
  TextRegular,
} from '@monorepo/expo/shared/ui-components';
import { formatPhoneNumber } from '@monorepo/expo/shared/utils';
import { format } from 'date-fns';
import { router } from 'expo-router';
import { Linking, View } from 'react-native';
import { TaskStatusEnum, TaskType } from '../../../apollo';
import { ClientViewTabEnum } from '../../../screens/Client/ClientTabs';
import { enumLanguageCode } from '../../../static';
import { ClientProfilesQuery } from '../../ClientProfileList/__generated__/ClientProfiles.generated';
import {
  TasksDocument,
  TasksQuery,
  TasksQueryVariables,
} from '../../TaskList/__generated__/Tasks.generated';

interface IClientSummaryGeneralProps {
  client: ClientProfilesQuery['clientProfiles']['results'][number];
  arrivedFrom?: string;
}

type TPanelContainerProps = {
  title: string | number;
  subtitle: string;
  icon: React.ReactNode;
  actionIcon?: React.ReactNode;
  variant?: 'default' | 'warning' | 'error' | 'primary';
  flex?: number;
  onPress?: () => void;
};

function PanelContainer({
  onPress,
  title,
  subtitle,
  icon,
  actionIcon,
  variant = 'primary',
  flex = 1,
}: TPanelContainerProps) {
  return (
    <Panel
      onPress={onPress}
      variant={variant}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: Spacings.xs,
        flex,
      }}
    >
      <View
        style={{ flexDirection: 'row', alignItems: 'center', gap: Spacings.xs }}
      >
        <View
          style={{
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor:
              variant === 'primary'
                ? Colors.PRIMARY_EXTRA_LIGHT
                : variant === 'warning'
                ? Colors.WARNING_LIGHT
                : Colors.ERROR_EXTRA_LIGHT,
            height: 30,
            width: 30,
            borderRadius: 100,
          }}
        >
          {icon}
        </View>
        <View>
          <TextBold
            color={
              variant === 'primary' ? Colors.PRIMARY_DARK : Colors.WARNING_DARK
            }
            size="xs"
          >
            {subtitle}
          </TextBold>
          <TextBold color={Colors.NEUTRAL_EXTRA_DARK} size="sm">
            {title}
          </TextBold>
        </View>
      </View>
      {actionIcon}
    </Panel>
  );
}

export default function ClientSummaryGeneral(
  props: IClientSummaryGeneralProps
) {
  const { client, arrivedFrom } = props;

  const { total, loading } = useInfiniteScrollQuery<
    TaskType,
    TasksQuery,
    TasksQueryVariables
  >({
    document: TasksDocument,
    queryFieldName: 'tasks',
    variables: {
      filters: {
        clientProfile: client.id,
        status: [TaskStatusEnum.InProgress, TaskStatusEnum.ToDo],
      },
    },
    pageSize: 0,
  });
  const primaryPhoneNumber = client.phoneNumbers?.find(
    (item) => item.isPrimary
  )?.number;

  const formattedNumber =
    primaryPhoneNumber && formatPhoneNumber(primaryPhoneNumber);

  return (
    <View style={{ gap: Spacings.xs }}>
      <View
        style={{
          flexDirection: 'row',
          gap: Spacings.xs,
          flex: 1,
        }}
      >
        <PanelContainer
          flex={3}
          title={
            client.dateOfBirth
              ? format(new Date(client.dateOfBirth), 'MM/dd/yy')
              : 'N/A'
          }
          subtitle="DOB"
          icon={<CakeIcon color={Colors.PRIMARY} />}
        />
        <PanelContainer
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
        <PanelContainer
          onPress={() =>
            formattedNumber && Linking.openURL(`tel:${formattedNumber}`)
          }
          flex={3}
          title={formattedNumber || 'N/A'}
          subtitle="CONTACT"
          icon={<CallOutlinedIcon color={Colors.PRIMARY} />}
          actionIcon={
            formattedNumber && (
              <ExternalLinkOutlinedIcon color={Colors.PRIMARY} />
            )
          }
        />
        <PanelContainer
          onPress={() =>
            total > 0 &&
            router.navigate({
              pathname: `/client/${client.id}`,
              params: { newTab: ClientViewTabEnum.Tasks, arrivedFrom },
            })
          }
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
        <Panel style={{ marginTop: Spacings.sm }} variant="error">
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
        </Panel>
      )}
    </View>
  );
}
