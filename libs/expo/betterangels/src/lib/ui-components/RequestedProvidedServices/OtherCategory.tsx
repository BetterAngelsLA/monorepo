import { ControlledInput } from '@monorepo/expo/shared/ui-components';
import { useForm } from 'react-hook-form';
import ServiceOtherCheckbox from './ServiceOtherCheckbox';

interface IOtherCategoryProps {
  services: {
    title: string | null;
    id: string | undefined;
    markedForDeletion?: boolean;
  }[];
  setServices: (
    services: {
      title: string | null;
      id: string | undefined;
      markedForDeletion?: boolean;
    }[]
  ) => void;
}

export default function OtherCategory(props: IOtherCategoryProps) {
  const { services, setServices } = props;

  const { control, setValue } = useForm();

  const appendService = (service: string) => {
    setServices([...services, { title: service, id: undefined }]);
  };

  const handleAddOtherCategory = async (newService: string) => {
    if (services.some((s) => s.title === newService)) {
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
            key={service.title}
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
