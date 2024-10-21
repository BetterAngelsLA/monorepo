import {
  ServiceEnum,
  ServiceRequestTypeEnum,
  useCreateNoteServiceRequestMutation,
  useDeleteServiceRequestMutation,
} from '@monorepo/expo/betterangels';
import { IIconProps } from '@monorepo/expo/shared/icons';
import { Colors } from '@monorepo/expo/shared/static';
import { Checkbox, TextRegular } from '@monorepo/expo/shared/ui-components';
import { debounce } from '@monorepo/expo/shared/utils';
import { useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';

interface IRequestedCheckboxProps {
  id: string | undefined;
  service: {
    title: string;
    enum: ServiceEnum;
    Icon: React.ComponentType<IIconProps>;
  };
  noteId: string | undefined;
  idx: number;
  services: {
    id: string | undefined;
    enum: ServiceEnum;
  }[];
  setServices: (
    services: {
      enum: ServiceEnum;
      id: string | undefined;
    }[]
  ) => void;
}

export default function RequestedCheckbox(props: IRequestedCheckboxProps) {
  const { service, idx, noteId, services, setServices, id: serviceId } = props;
  const [isChecked, setIsChecked] = useState(serviceId ? true : false);
  const [id, setId] = useState<string | undefined>(serviceId);
  const [isLoading, setIsLoading] = useState(false);

  const [createNoteServiceRequest, { error }] =
    useCreateNoteServiceRequestMutation();
  const [deleteServiceRequest, { error: deleteError }] =
    useDeleteServiceRequestMutation();

  const executeMutation = useRef(
    debounce(async (checked, currentId) => {
      if (!noteId) return;
      try {
        if (!checked && currentId) {
          const { data } = await deleteServiceRequest({
            variables: {
              data: {
                id: currentId,
              },
            },
          });
          if (!data) {
            console.error('Error deleting service', deleteError);
          }

          setId(undefined);
        } else {
          const { data } = await createNoteServiceRequest({
            variables: {
              data: {
                service: service.enum,
                noteId,
                serviceRequestType: ServiceRequestTypeEnum.Requested,
              },
            },
          });
          if (!data) {
            console.log('Error creating service', error);
            return;
          }

          if ('id' in data.createNoteServiceRequest) {
            const createdServiceId = data.createNoteServiceRequest.id;

            setId(createdServiceId);
          }
        }
        setIsLoading(false);
      } catch (err) {
        setIsLoading(false);
        console.log('Error creating service', err);
      }
    }, 300)
  ).current;

  const handleCheck = () => {
    if (isLoading) return;
    setIsLoading(true);
    setIsChecked((prev) => !prev);
    const newServices = id
      ? services.filter((s) => s.enum !== service.enum)
      : [
          ...services,
          {
            id,
            serviceOther: '',
            enum: service.enum,
          },
        ];
    setServices(newServices);
    executeMutation(!isChecked, id);
  };

  return (
    <Checkbox
      isChecked={isChecked}
      mt={idx !== 0 ? 'xs' : undefined}
      hasBorder
      onCheck={handleCheck}
      accessibilityHint={service.title}
      label={
        <View style={styles.labelContainer}>
          <service.Icon color={Colors.PRIMARY_EXTRA_DARK} size="md" />
          <TextRegular ml="xs">{service.title}</TextRegular>
        </View>
      }
    />
  );
}

const styles = StyleSheet.create({
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
