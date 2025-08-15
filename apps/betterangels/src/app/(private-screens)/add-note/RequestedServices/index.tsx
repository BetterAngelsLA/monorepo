import {
  RequestedProvidedServices,
  ServiceRequestTypeEnum,
  ViewNoteQuery,
} from '@monorepo/expo/betterangels';
import { RefObject } from 'react';
import { ScrollView } from 'react-native';

interface IRequestedServicesProps {
  noteId: string;
  scrollRef: RefObject<ScrollView | null>;
  serviceRequests: ViewNoteQuery['note']['requestedServices'];
  refetch: () => void;
}

export default function RequestedServices(props: IRequestedServicesProps) {
  const { noteId, serviceRequests, scrollRef, refetch } = props;

  return (
    <RequestedProvidedServices
      noteId={noteId}
      scrollRef={scrollRef}
      serviceRequests={serviceRequests}
      refetch={refetch}
      type={ServiceRequestTypeEnum.Requested}
    />
  );
}
