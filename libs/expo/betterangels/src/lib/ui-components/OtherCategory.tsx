import { PlusIcon } from '@monorepo/expo/shared/icons';
import { Colors, Spacings } from '@monorepo/expo/shared/static';
import {
  Checkbox,
  Input,
  TextRegular,
} from '@monorepo/expo/shared/ui-components';
import { useForm } from 'react-hook-form';
import { StyleSheet, View } from 'react-native';
import {
  useCreateNoteServiceRequestMutation,
  useDeleteServiceRequestMutation,
} from '../apollo/graphql/__generated__/mutations.generated';
import {
  ServiceEnum,
  ServiceRequestTypeEnum,
} from '../apollo/graphql/__generated__/types';

interface IOtherCategoryProps {
  noteId: string | undefined;
  services: { title: string; id: string | undefined }[];
  setServices: (services: { title: string; id: string | undefined }[]) => void;
  serviceType:
    | ServiceRequestTypeEnum.Provided
    | ServiceRequestTypeEnum.Requested;
}

export default function OtherCategory(props: IOtherCategoryProps) {
  const { services, serviceType, setServices, noteId } = props;
  const [createNoteServiceRequest, { error }] =
    useCreateNoteServiceRequestMutation();
  const [deleteServiceRequest, { error: deleteError }] =
    useDeleteServiceRequestMutation();
  const { control, setValue } = useForm();

  const toggleServices = async (service: string) => {
    if (!noteId) return;
    try {
      if (services.some((s) => s.title === service)) {
        const id = services.find((s) => s.title === service)?.id;

        if (!id) throw new Error('Something went wrong');
        const { data } = await deleteServiceRequest({
          variables: {
            data: {
              id,
            },
          },
        });
        if (!data) {
          console.error('Error deleting service', deleteError);
          return;
        }

        const newServices = services.filter((s) => s.id !== id);
        setServices(newServices);
      } else {
        const { data } = await createNoteServiceRequest({
          variables: {
            data: {
              service: ServiceEnum.Other,
              serviceOther: service,
              noteId,
              serviceRequestType: serviceType,
            },
          },
        });
        if (!data) {
          console.error('Error creating service', error);
          return;
        }

        if ('id' in data.createNoteServiceRequest) {
          const newServices = [
            ...services,
            {
              id: data.createNoteServiceRequest.id,
              title: service,
            },
          ];

          setServices(newServices);
        }
      }
    } catch (err) {
      console.log('TOOGLE CHECKBOX ERROR: ', err);
    }
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
      {services.map((service) => (
        <Checkbox
          isChecked={services.some((s) => s.title === service.title)}
          mt={'xs'}
          key={service.title}
          hasBorder
          onCheck={() => toggleServices(service.title)}
          accessibilityHint={service.title}
          label={
            <View style={styles.labelContainer}>
              <PlusIcon color={Colors.PRIMARY_EXTRA_DARK} size="sm" />
              <TextRegular ml="xs">{service.title}</TextRegular>
            </View>
          }
        />
      ))}
      <Input
        placeholder="Enter other category"
        onSubmitEditing={(e) => handleOtherCategory(e.nativeEvent.text)}
        icon={<PlusIcon ml="sm" color={Colors.PRIMARY_EXTRA_DARK} size="sm" />}
        mt="xs"
        name="otherCategory"
        height={Spacings.xl}
        control={control}
      />
    </>
  );
}

const styles = StyleSheet.create({
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
