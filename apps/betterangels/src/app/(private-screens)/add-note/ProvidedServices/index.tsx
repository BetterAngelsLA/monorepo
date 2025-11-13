import { useQuery } from '@apollo/client/react';
import {
  RequestedProvidedServices,
  ServiceRequestTypeEnum,
  ViewNoteQuery,
  ViewNoteQueryVariables,
} from '@monorepo/expo/betterangels';
import { RefObject } from 'react';
import { ScrollView } from 'react-native';

interface IProvidedServicesProps {
  noteId: string;
  scrollRef: RefObject<ScrollView | null>;
  services: ViewNoteQuery['note']['providedServices'];
  refetch: useQuery.Result<ViewNoteQuery, ViewNoteQueryVariables>['refetch'];
}

export default function ProvidedServices(props: IProvidedServicesProps) {
  const { noteId, services, scrollRef, refetch } = props;

  return (
    <RequestedProvidedServices
      noteId={noteId}
      scrollRef={scrollRef}
      services={services}
      refetch={refetch}
      type={ServiceRequestTypeEnum.Provided}
    />
  );
}
