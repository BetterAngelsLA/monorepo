import { ApolloQueryResult } from '@apollo/client';
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
  serviceRequests: ViewNoteQuery['note']['providedServices'];
  refetch: (
    variables?: Partial<ViewNoteQueryVariables>
  ) => Promise<ApolloQueryResult<ViewNoteQuery>>;
}

export default function ProvidedServices(props: IProvidedServicesProps) {
  const { noteId, serviceRequests, scrollRef, refetch } = props;

  return (
    <RequestedProvidedServices
      noteId={noteId}
      scrollRef={scrollRef}
      serviceRequests={serviceRequests}
      refetch={refetch}
      type={ServiceRequestTypeEnum.Provided}
    />
  );
}
