import {
  HmisRequestedProvidedServices,
  ServiceRequestTypeEnum,
} from '@monorepo/expo/betterangels';
import { ViewHmisNoteQuery } from '../../HmisProgramNoteView/__generated__/HmisProgramNoteView.generated';

interface IRequestedServicesProps {
  services?: ViewHmisNoteQuery['hmisNote']['requestedServices'];
}

export default function RequestedServices(props: IRequestedServicesProps) {
  const { services } = props;

  return (
    <HmisRequestedProvidedServices
      services={services}
      type={ServiceRequestTypeEnum.Requested}
    />
  );
}
