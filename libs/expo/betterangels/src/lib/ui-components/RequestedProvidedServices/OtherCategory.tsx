import { ControlledInput } from '@monorepo/expo/shared/ui-components';
import { useForm } from 'react-hook-form';
import ServiceOtherCheckbox from './ServiceOtherCheckbox';

interface IOtherCategoryProps {
  serviceRequests: {
    serviceOther: string | null;
    serviceRequestId: string | undefined;
    markedForDeletion?: boolean;
  }[];
  setServiceRequests: (
    services: {
      serviceOther: string | null;
      serviceRequestId: string | undefined;
      markedForDeletion?: boolean;
    }[]
  ) => void;
}

export default function OtherCategory(props: IOtherCategoryProps) {
  const { serviceRequests, setServiceRequests } = props;

  const { control, setValue } = useForm();

  const appendService = (service: string) => {
    setServiceRequests([
      ...serviceRequests,
      { serviceOther: service, serviceRequestId: undefined },
    ]);
  };

  const handleAddOtherCategory = async (newService: string) => {
    if (serviceRequests.some((s) => s.serviceOther === newService)) {
      return;
    }
    appendService(newService);
    setValue('otherCategory', '');
  };

  return (
    <>
      {serviceRequests.map((service, idx) => {
        return (
          <ServiceOtherCheckbox
            key={service.serviceOther}
            serviceRequests={serviceRequests}
            setServiceRequests={setServiceRequests}
            service={service}
            idx={idx}
          />
        );
      })}

      <ControlledInput
        mt="xs"
        name="otherCategory"
        placeholder="Enter other category"
        control={control}
        onDelete={() => setValue('otherCategory', '')}
        onSubmitEditing={(e) => {
          handleAddOtherCategory(e.nativeEvent.text);
        }}
      />
    </>
  );
}
