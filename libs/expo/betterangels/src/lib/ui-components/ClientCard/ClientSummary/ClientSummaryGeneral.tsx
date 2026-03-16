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
import { format } from 'date-fns';
import { router } from 'expo-router';
import { Linking, Pressable, View } from 'react-native';
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
  action?: React.ReactNode;
  variant?: 'default' | 'warning' | 'error' | 'primary';
  flex?: number;
};

function PanelContainer({
  title,
  subtitle,
  icon,
  action,
  variant = 'primary',
  flex = 1,
}: TPanelContainerProps) {
  return (
    <Panel
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
      {action}
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
          flex={3}
          title={client.phoneNumber || 'N/A'}
          subtitle="CONTACT"
          icon={<CallOutlinedIcon color={Colors.PRIMARY} />}
          action={
            client.phoneNumber && (
              <Pressable
                accessibilityRole="button"
                onPress={() => Linking.openURL(`tel:${client.phoneNumber}`)}
              >
                <ExternalLinkOutlinedIcon color={Colors.PRIMARY} />
              </Pressable>
            )
          }
        />
        <PanelContainer
          flex={2}
          title={loading ? '' : total.toString() || '0'}
          subtitle="TASKS"
          icon={<ListIcon color={Colors.WARNING_DARK} />}
          variant="warning"
          action={
            total > 0 && (
              <Pressable
                accessibilityRole="button"
                onPress={() =>
                  router.navigate({
                    pathname: `/client/${client.id}`,
                    params: { newTab: ClientViewTabEnum.Tasks, arrivedFrom },
                  })
                }
              >
                <ExternalLinkOutlinedIcon color={Colors.WARNING_DARK} />
              </Pressable>
            )
          }
        />
      </View>
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
        {client.importantNotes && (
          <TextRegular color={Colors.ERROR_DARK}>
            {client.importantNotes}
          </TextRegular>
        )}
      </Panel>
    </View>
  );
}
