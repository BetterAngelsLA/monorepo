import { Spacings } from '@monorepo/expo/shared/static';
import { FieldCard, Pill } from '@monorepo/expo/shared/ui-components';
import { RefObject, useState } from 'react';
import { ScrollView, View } from 'react-native';
import {
  ServiceEnum,
  ServiceRequestTypeEnum,
  ViewNoteQuery,
} from '../../apollo';
import { enumDisplayServices, enumDisplayServiceType } from '../../static';
import ServicesModal from './ServicesModal';

interface IRequestedServicesProps {
  noteId: string;
  scrollRef: RefObject<ScrollView>;
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
  const [isModalVisible, setIsModalVisible] = useState(false);

  if (!initialServices) return null;

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
      setExpanded={() => setIsModalVisible(true)}
    >
      <ServicesModal
        type={type}
        refetch={refetch}
        initialServices={initialServices}
        setIsModalVisible={setIsModalVisible}
        noteId={noteId}
        isModalVisible={isModalVisible}
      />
    </FieldCard>
  );
}
