import { Spacings } from '@monorepo/expo/shared/static';
import { Input } from '@monorepo/expo/shared/ui-components';
import { useForm } from 'react-hook-form';
import ServiceOtherCheckbox from './ServiceOtherCheckbox';

interface IOtherCategoryProps {
  noteId: string;
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
  const { services, setServices, noteId } = props;

  const { control, setValue } = useForm();

  const toggleServices = (service: string) => {
    setServices([...services, { title: service, id: undefined }]);
  };

  const handleOtherCategory = async (e: string) => {
    if (services.some((s) => s.title === e)) {
      return;
    }
    toggleServices(e);
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
            noteId={noteId}
            service={service}
            idx={idx}
          />
        );
      })}
      <Input
        placeholder="Enter other category"
        onSubmitEditing={(e) => handleOtherCategory(e.nativeEvent.text)}
        mt="xs"
        name="otherCategory"
        height={Spacings.xl}
        control={control}
      />
    </>
  );
}
