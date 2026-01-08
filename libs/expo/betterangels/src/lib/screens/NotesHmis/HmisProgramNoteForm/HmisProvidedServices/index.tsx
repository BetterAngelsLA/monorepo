import { ServiceRequestTypeEnum } from '../../../../apollo';
import { HmisRequestedProvidedServices } from '../../../../ui-components';
import { ServicesDraft } from '../formSchema';

type ProvidedServiceRequests = NonNullable<
  ServicesDraft[ServiceRequestTypeEnum.Provided]
>['serviceRequests'];

interface IHmisProvidedServicesProps {
  services?: ProvidedServiceRequests | null;
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
