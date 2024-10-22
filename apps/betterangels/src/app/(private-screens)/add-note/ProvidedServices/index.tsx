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
  noteId: string | undefined;
  scrollRef: RefObject<ScrollView>;
  services: ViewNoteQuery['note']['providedServices'];
  refetch: (
    variables?: Partial<ViewNoteQueryVariables>
  ) => Promise<ApolloQueryResult<ViewNoteQuery>>;
}

export default function ProvidedServices(props: IProvidedServicesProps) {
  const { noteId, services, scrollRef, refetch } = props;

  if (!noteId) return null;

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
