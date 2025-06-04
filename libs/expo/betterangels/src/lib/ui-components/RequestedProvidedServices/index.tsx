import { FieldCard, Pill } from '@monorepo/expo/shared/ui-components';
import { useScreenModal } from 'apps/betterangels/src/providers/ScreenModalProvider';
import { useRouter } from 'expo-router';
import { RefObject } from 'react';
import { Spacings } from '@monorepo/expo/shared/static';
import { ScrollView, View } from 'react-native';
import {
  ServiceEnum,
  ServiceRequestTypeEnum,
  ViewNoteQuery,
} from '../../apollo';
import { enumDisplayServices, enumDisplayServiceType } from '../../static';

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
  const router = useRouter();
  const { showScreenModal } = useScreenModal();

  const openServicesModal = () => {
    showScreenModal({
      route: '/base-modal-screen',
      params: { type: type === ServiceRequestTypeEnum.Provided ? 'PROVIDED' : 'REQUESTED' }
    });
  };

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
                type={
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
      setExpanded={openServicesModal}
    >
    <></>
    </FieldCard>
  );
}
