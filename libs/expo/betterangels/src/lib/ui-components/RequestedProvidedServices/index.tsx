import { Spacings } from '@monorepo/expo/shared/static';
import { FieldCard, Pill } from '@monorepo/expo/shared/ui-components';
import { RefObject } from 'react';
import { ScrollView, View } from 'react-native';
import {
  ServiceEnum,
  ServiceRequestTypeEnum,
  ViewNoteQuery,
} from '../../apollo';
import { useModalScreen } from '../../providers';
import { enumDisplayServiceType, enumDisplayServices } from '../../static';
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
  const { noteId, services: initialServices, scrollRef, refetch, type } = props;
  const { showModalScreen } = useModalScreen();

  if (!initialServices) {
    return null;
  }

  return (
    <FieldCard
      scrollRef={scrollRef}
      actionName={
        initialServices.length ? (
          <View
            style={{
              flexDirection: 'row',
              flexWrap: 'wrap',
              gap: Spacings.xs,
            }}
          >
            {initialServices.map((item, index) => (
              <Pill
                variant={
                  type === ServiceRequestTypeEnum.Provided
                    ? 'success'
                    : 'primary'
                }
                key={index}
                label={
                  item.service !== ServiceEnum.Other
                    ? enumDisplayServices[item.service]
                    : item.serviceOther || ''
                }
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
          content: (
            <ServicesModal
              noteId={noteId}
              type={type}
              initialServices={initialServices}
              refetch={refetch}
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
