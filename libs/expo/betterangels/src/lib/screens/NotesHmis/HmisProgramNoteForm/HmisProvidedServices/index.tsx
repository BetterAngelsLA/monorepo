import { ServiceRequestTypeEnum } from '../../../../apollo';
import { HmisRequestedProvidedServices } from '../../../../ui-components';
import { ViewHmisNoteQuery } from '../../HmisProgramNoteView/__generated__/HmisProgramNoteView.generated';

interface IHmisProvidedServicesProps {
  services?: ViewHmisNoteQuery['hmisNote']['providedServices'];
}

export default function HmisProvidedServices(
  props: IHmisProvidedServicesProps
) {
  const { services } = props;

  return (
    <HmisRequestedProvidedServices
      services={services}
      type={ServiceRequestTypeEnum.Provided}
    />
  );
}
