import {
  RequestedProvidedServices,
  ServiceRequestTypeEnum,
  ViewNoteQuery,
} from '@monorepo/expo/betterangels';
import { RefObject } from 'react';
import { ScrollView } from 'react-native';

interface IRequestedServicesProps {
  noteId: string;
  scrollRef: RefObject<ScrollView>;
  services: ViewNoteQuery['note']['requestedServices'];
  refetch: () => void;
}

export default function RequestedServices(props: IRequestedServicesProps) {
  const { noteId, services, scrollRef, refetch } = props;

  return (
    <RequestedProvidedServices
      noteId={noteId}
      scrollRef={scrollRef}
      services={services}
      refetch={refetch}
      type={ServiceRequestTypeEnum.Requested}
    />
  );
}
