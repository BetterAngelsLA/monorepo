import { ControlledInput } from '@monorepo/expo/shared/ui-components';
import { useForm } from 'react-hook-form';
import ServiceOtherCheckbox from './ServiceOtherCheckbox';

interface IOtherCategoryProps {
  services: {
    serviceOther: string | null;
    serviceRequestId: string | undefined;
    markedForDeletion?: boolean;
  }[];
  setServices: (
    services: {
      serviceOther: string | null;
      serviceRequestId: string | undefined;
      markedForDeletion?: boolean;
    }[]
  ) => void;
}

export default function OtherCategory(props: IOtherCategoryProps) {
  const { services, setServices } = props;

  const { control, setValue } = useForm();

  const appendService = (service: string) => {
    setServices([
      ...services,
      { serviceOther: service, serviceRequestId: undefined },
    ]);
  };

  const handleAddOtherCategory = async (newService: string) => {
    if (services.some((s) => s.serviceOther === newService)) {
      return;
    }
    appendService(newService);
    setValue('otherCategory', '');
  };

  return (
    <>
      {services.map((service, idx) => {
        return (
          <ServiceOtherCheckbox
            key={service.serviceOther}
            services={services}
            setServices={setServices}
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
