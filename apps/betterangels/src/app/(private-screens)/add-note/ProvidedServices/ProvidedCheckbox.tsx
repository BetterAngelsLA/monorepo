import { useMutation } from '@apollo/client';
import {
  CREATE_NOTE_SERVICE_REQUEST,
  CreateNoteServiceRequestMutation,
  CreateNoteServiceRequestMutationVariables,
  DELETE_SERVICE_REQUEST,
  DeleteServiceRequestMutation,
  DeleteServiceRequestMutationVariables,
  ServiceEnum,
  ServiceRequestTypeEnum,
} from '@monorepo/expo/betterangels';
import { IIconProps } from '@monorepo/expo/shared/icons';
import { Colors } from '@monorepo/expo/shared/static';
import { BodyText, Checkbox } from '@monorepo/expo/shared/ui-components';
import { debounce } from '@monorepo/expo/shared/utils';
import { useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';

interface IProvidedCheckboxProps {
  service: {
    title: string;
    enum: ServiceEnum;
    Icon: React.ComponentType<IIconProps>;
  };
  noteId: string | undefined;
  idx: number;
  services: {
    id: string | undefined;
    service: string;
    enum: ServiceEnum;
  }[];
  setServices: (
    e: {
      service: string;
      enum: ServiceEnum;
      id: string | undefined;
    }[]
  ) => void;
}

export default function ProvidedCheckbox(props: IProvidedCheckboxProps) {
  const { service, idx, noteId, services, setServices } = props;
  const [isChecked, setIsChecked] = useState(false);
  const [id, setId] = useState<string | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);

  const [createNoteServiceRequest, { error }] = useMutation<
    CreateNoteServiceRequestMutation,
    CreateNoteServiceRequestMutationVariables
  >(CREATE_NOTE_SERVICE_REQUEST);
  const [deleteServiceRequest, { error: deleteError }] = useMutation<
    DeleteServiceRequestMutation,
    DeleteServiceRequestMutationVariables
  >(DELETE_SERVICE_REQUEST);

  const executeMutation = useRef(
    debounce(async () => {
      if (!noteId) return;
      try {
        if (isChecked && id) {
          const { data } = await deleteServiceRequest({
            variables: {
              data: {
                id,
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
                serviceRequestType: ServiceRequestTypeEnum.Provided,
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
      } catch (e) {
        setIsLoading(false);
        console.log('Error creating service', e);
      }
    }, 300)
  ).current;

  const handleCheck = () => {
    if (isLoading) return;
    setIsLoading(true);
    setIsChecked((prev) => !prev);
    const newServices = id
      ? services.filter((s) => s.service !== service.title)
      : [
          ...services,
          {
            id,
            service: service.title,
            customService: '',
            enum: service.enum,
          },
        ];
    setServices(newServices);
    executeMutation();
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
          <BodyText ml="xs">{service.title}</BodyText>
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
