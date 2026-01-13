import { Spacings } from '@monorepo/expo/shared/static';
import { FieldCard, Pill } from '@monorepo/expo/shared/ui-components';
import { RefObject } from 'react';
import { ScrollView, View } from 'react-native';
import { ServiceRequestTypeEnum, ViewNoteQuery } from '../../apollo';
import { normalizeService } from '../../helpers';
import { useModalScreen } from '../../providers';
import { enumDisplayServiceType } from '../../static';
import ServicesModal from './ServicesModal';

interface IRequestedServicesProps {
  noteId: string;
  scrollRef: RefObject<ScrollView | null>;
  services:
    | ViewNoteQuery['note']['requestedServices']
    | ViewNoteQuery['note']['providedServices'];
  refetch: () => void;
  type: ServiceRequestTypeEnum.Provided | ServiceRequestTypeEnum.Requested;
}

export default function RequestedProvidedServices(
  props: IRequestedServicesProps
) {
  const {
    noteId,
    services: initialServiceRequests,
    scrollRef,
    refetch,
    type,
  } = props;
  const { showModalScreen } = useModalScreen();

  if (!initialServiceRequests) {
    return null;
  }

  const normalizedServiceRequests =
    initialServiceRequests?.map(normalizeService) ?? [];

  return (
    <FieldCard
      scrollRef={scrollRef}
      actionName={
        initialServiceRequests.length ? (
          <View
            style={{
              flexDirection: 'row',
              flexWrap: 'wrap',
              gap: Spacings.xs,
            }}
          >
            {initialServiceRequests.map((item, index) => (
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
          presentation: 'fullScreenModal',
          hideHeader: true,
          renderContent: ({ close }) => (
            <ServicesModal
              noteId={noteId}
              type={type}
              initialServiceRequests={normalizedServiceRequests}
              refetch={refetch}
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
