import { ServiceRequestTypeEnum } from '../../../../apollo';
import { RequestedProvidedServicesHmis } from '../../../../ui-components';
import { ServicesDraft } from '../formSchema';

type RequestedServiceRequests = NonNullable<
  ServicesDraft[ServiceRequestTypeEnum.Requested]
>['serviceRequests'];

interface IRequestedServicesProps {
  services?: RequestedServiceRequests | null;
}

export default function RequestedServicesHmis(props: IRequestedServicesProps) {
  const { services } = props;

  return (
    <RequestedProvidedServicesHmis
      services={services}
      type={ServiceRequestTypeEnum.Requested}
    />
  );
}
