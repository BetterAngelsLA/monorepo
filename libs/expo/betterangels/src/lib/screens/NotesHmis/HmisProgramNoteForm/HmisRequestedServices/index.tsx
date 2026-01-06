import { ServiceRequestTypeEnum } from '../../../../apollo';
import { HmisRequestedProvidedServices } from '../../../../ui-components';
import { ServicesDraft } from '../formSchema';

type ProvidedServiceRequests = NonNullable<
  ServicesDraft[ServiceRequestTypeEnum.Requested]
>['serviceRequests'];

interface IRequestedServicesProps {
  services?: ProvidedServiceRequests | null;
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
