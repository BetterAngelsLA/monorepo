import { ApolloQueryResult } from '@apollo/client';
import {
  enumDisplayServices,
  ServiceEnum,
  ViewNoteQuery,
  ViewNoteQueryVariables,
} from '@monorepo/expo/betterangels';
import { Spacings } from '@monorepo/expo/shared/static';
import { FieldCard, Pill } from '@monorepo/expo/shared/ui-components';
import { RefObject, useState } from 'react';
import { ScrollView, View } from 'react-native';
import RequestedServicesModal from './RequestedServicesModal';

interface IRequestedServicesProps {
  noteId: string | undefined;
  scrollRef: RefObject<ScrollView>;
  services: ViewNoteQuery['note']['requestedServices'];
  refetch: (
    variables?: Partial<ViewNoteQueryVariables>
  ) => Promise<ApolloQueryResult<ViewNoteQuery>>;
}

export default function RequestedServices(props: IRequestedServicesProps) {
  const { noteId, services, scrollRef, refetch } = props;
  const [isModalVisible, setIsModalVisible] = useState(false);

  const closeModal = () => {
    refetch();
    setIsModalVisible(false);
  };

  if (!services) return null;

  return (
    <FieldCard
      scrollRef={scrollRef}
      actionName={
        services.length ? (
          <View
            style={{
              flexDirection: 'row',
              flexWrap: 'wrap',
              gap: Spacings.xs,
            }}
          >
            {services.map((item, index) => (
              <Pill
                type="primary"
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
      title="Requested Services"
      setExpanded={() => setIsModalVisible(true)}
    >
      <RequestedServicesModal
        refetch={refetch}
        initialServices={services}
        closeModal={closeModal}
        noteId={noteId}
        isModalVisible={isModalVisible}
      />
    </FieldCard>
  );
}
