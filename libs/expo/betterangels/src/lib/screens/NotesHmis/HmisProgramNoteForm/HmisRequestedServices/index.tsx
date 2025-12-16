import { ServiceRequestTypeEnum } from '../../../../apollo';
import { HmisRequestedProvidedServices } from '../../../../ui-components';
import { ViewHmisNoteQuery } from '../../HmisProgramNoteView/__generated__/HmisProgramNoteView.generated';

interface IRequestedServicesProps {
  services?: ViewHmisNoteQuery['hmisNote']['requestedServices'];
}

export default function HmisRequestedServices(props: IRequestedServicesProps) {
  const { services } = props;

  return (
    <HmisRequestedProvidedServices
      services={services}
      type={ServiceRequestTypeEnum.Requested}
    />
  );
}
