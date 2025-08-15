import { ControlledInput } from '@monorepo/expo/shared/ui-components';
import { useForm } from 'react-hook-form';
import ServiceRequestOtherCheckbox from './ServiceRequestOtherCheckbox';

interface IOtherCategoryProps {
  serviceRequests: {
    title: string | null;
    id: string | undefined;
    markedForDeletion?: boolean;
  }[];
  setServiceRequests: (
    serviceRequests: {
      title: string | null;
      id: string | undefined;
      markedForDeletion?: boolean;
    }[]
  ) => void;
}

export default function OtherCategory(props: IOtherCategoryProps) {
  const { serviceRequests, setServiceRequests } = props;

  const { control, setValue } = useForm();

  const appendServiceRequest = (serviceRequest: string) => {
    setServiceRequests([
      ...serviceRequests,
      { title: serviceRequest, id: undefined },
    ]);
  };

  const handleAddOtherCategory = async (newServiceRequest: string) => {
    if (serviceRequests.some((s) => s.title === newServiceRequest)) {
      return;
    }
    appendServiceRequest(newServiceRequest);
    setValue('otherCategory', '');
  };

  return (
    <>
      {serviceRequests.map((serviceRequest, idx) => {
        return (
          <ServiceRequestOtherCheckbox
            key={serviceRequest.title}
            serviceRequests={serviceRequests}
            setServiceRequests={setServiceRequests}
            serviceRequest={serviceRequest}
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
