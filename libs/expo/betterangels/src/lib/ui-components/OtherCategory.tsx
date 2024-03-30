import { useMutation } from '@apollo/client';
import { PlusIcon } from '@monorepo/expo/shared/icons';
import { Colors } from '@monorepo/expo/shared/static';
import { BodyText, Checkbox, Input } from '@monorepo/expo/shared/ui-components';
import { useForm } from 'react-hook-form';
import { StyleSheet, View } from 'react-native';
import {
  CREATE_NOTE_SERVICE_REQUEST,
  CreateNoteServiceRequestMutation,
  CreateNoteServiceRequestMutationVariables,
  DELETE_SERVICE_REQUEST,
  DeleteServiceRequestMutation,
  DeleteServiceRequestMutationVariables,
  ServiceEnum,
  ServiceRequestTypeEnum,
} from '../apollo';

interface IOtherCategoryProps {
  noteId: string | undefined;
  services: { title: string; id: string | undefined }[];
  setServices: (e: { title: string; id: string | undefined }[]) => void;
  serviceType:
    | ServiceRequestTypeEnum.Provided
    | ServiceRequestTypeEnum.Requested;
}

export default function OtherCategory(props: IOtherCategoryProps) {
  const { services, serviceType, setServices, noteId } = props;
  const [createNoteServiceRequest] = useMutation<
    CreateNoteServiceRequestMutation,
    CreateNoteServiceRequestMutationVariables
  >(CREATE_NOTE_SERVICE_REQUEST);
  const [deleteServiceRequest] = useMutation<
    DeleteServiceRequestMutation,
    DeleteServiceRequestMutationVariables
  >(DELETE_SERVICE_REQUEST);
  const { control, setValue } = useForm();

  const toggleServices = async (service: string) => {
    if (!noteId) return;
    try {
      if (services.some((s) => s.title === service)) {
        const id = services.find((s) => s.title === service)?.id;

        if (!id) throw new Error('Something went wrong');
        await deleteServiceRequest({
          variables: {
            data: {
              id,
            },
          },
        });

        const newServices = services.filter((s) => s.id !== id);
        setServices(newServices);
      } else {
        const { data } = await createNoteServiceRequest({
          variables: {
            data: {
              service: ServiceEnum.Other,
              customService: service,
              noteId,
              serviceRequestType: serviceType,
            },
          },
        });

        if (
          data?.createNoteServiceRequest.__typename === 'ServiceRequestType'
        ) {
          const newServices = [
            ...services,
            {
              id: data?.createNoteServiceRequest.id,
              title: service,
            },
          ];

          setServices(newServices);
        } else if (
          data?.createNoteServiceRequest.__typename === 'OperationInfo'
        ) {
          console.log(data.createNoteServiceRequest.messages);
        }
      }
    } catch (e) {
      console.log('TOOGLE CHECKBOX ERROR: ', e);
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
              <BodyText ml="xs">{service.title}</BodyText>
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
        height={40}
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
