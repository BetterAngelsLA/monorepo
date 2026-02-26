import { ServiceRequestTypeEnum } from '../../../../apollo';
import { RequestedProvidedServicesHmis } from '../../../../ui-components';
import { ServicesDraft } from '../formSchema';

type ProvidedServiceRequests = NonNullable<
  ServicesDraft[ServiceRequestTypeEnum.Provided]
>['serviceRequests'];

interface IProvidedServicesHmisProps {
  services?: ProvidedServiceRequests | null;
}

export default function ProvidedServicesHmis(
  props: IProvidedServicesHmisProps
) {
  const { services } = props;

  return (
    <RequestedProvidedServicesHmis
      services={services}
      type={ServiceRequestTypeEnum.Provided}
    />
  );
}
