import { Spacings } from '@monorepo/expo/shared/static';
import { FieldCard, Pill } from '@monorepo/expo/shared/ui-components';
import { RefObject } from 'react';
import { ScrollView, View } from 'react-native';
import { ServiceRequestTypeEnum, ViewNoteQuery } from '../../apollo';
import { NoteFormServiceItem } from '../../screens/NoteForm/schema';
import { normalizeService } from '../../helpers';
import { useModalScreen } from '../../providers';
import { enumDisplayServiceType } from '../../static';
import ServicesModal from './ServicesModal';

interface IRequestedServicesProps {
  noteId?: string;
  scrollRef: RefObject<ScrollView | null>;
  services:
    | NoteFormServiceItem[]
    | ViewNoteQuery['note']['requestedServices']
    | ViewNoteQuery['note']['providedServices'];
  refetch?: () => void;
  onServicesChange?: (services: NoteFormServiceItem[]) => void;
  type: ServiceRequestTypeEnum.Provided | ServiceRequestTypeEnum.Requested;
}

export default function RequestedProvidedServices(
  props: IRequestedServicesProps
) {
  const {
    noteId,
    services: initialServices,
    scrollRef,
    refetch,
    onServicesChange,
    type,
  } = props;
  const { showModalScreen } = useModalScreen();

  if (!initialServices) {
    return null;
  }

  // Determine display labels based on data shape
  const displayLabels: string[] = [];
  const isLocalMode = !!onServicesChange;

  if (isLocalMode) {
    // Local mode: services are NoteFormServiceItem[] (with optional display label)
    const localServices = initialServices as NoteFormServiceItem[];
    localServices.forEach((s) => {
      const display = s.label || s.serviceOther;
      if (display) {
        displayLabels.push(display);
      }
    });
  } else {
    // Server mode: services are ViewNoteQuery shape
    const serverServices =
      initialServices as ViewNoteQuery['note']['providedServices'];
    serverServices.forEach((s) => {
      if (s.service?.label) {
        displayLabels.push(s.service.label);
      }
    });
  }

  // For ServicesModal in local mode, we need normalized initial service requests
  const normalizedServiceRequests = !isLocalMode
    ? (initialServices as ViewNoteQuery['note']['providedServices'])?.map(
        normalizeService
      ) ?? []
    : [];

  return (
    <FieldCard
      scrollRef={scrollRef}
      actionName={
        displayLabels.length > 0 ||
        (!isLocalMode &&
          (initialServices as ViewNoteQuery['note']['providedServices'])
            .length > 0) ? (
          <View
            style={{
              flexDirection: 'row',
              flexWrap: 'wrap',
              gap: Spacings.xs,
            }}
          >
            {isLocalMode
              ? displayLabels.map((label, index) => (
                  <Pill
                    variant={
                      type === ServiceRequestTypeEnum.Provided
                        ? 'success'
                        : 'warning'
                    }
                    key={index}
                    label={label}
                  />
                ))
              : (
                  initialServices as ViewNoteQuery['note']['providedServices']
                ).map((item, index) => (
                  <Pill
                    variant={
                      type === ServiceRequestTypeEnum.Provided
                        ? 'success'
                        : 'warning'
                    }
                    key={index}
                    label={item.service?.label || ''}
                  />
                ))}
          </View>
        ) : (
          ''
        )
      }
      mb="xs"
      title={`${enumDisplayServiceType[type]} Services`}
      setExpanded={() =>
        showModalScreen({
          presentation: 'modal',
          title: `${enumDisplayServiceType[type]} Services`,
          renderContent: ({ close }) => (
            <ServicesModal
              noteId={noteId}
              type={type}
              initialServiceRequests={normalizedServiceRequests}
              initialLocalServices={
                isLocalMode
                  ? (initialServices as NoteFormServiceItem[])
                  : undefined
              }
              refetch={refetch}
              onServicesChange={onServicesChange}
              close={close}
            />
          ),
        })
      }
    >
      <></>
    </FieldCard>
  );
}

export { default as ServicesModal } from './ServicesModal';
