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
  debounce,
} from '@monorepo/expo/betterangels';
import { IIconProps } from '@monorepo/expo/shared/icons';
import { Colors } from '@monorepo/expo/shared/static';
import { BodyText, Checkbox } from '@monorepo/expo/shared/ui-components';
import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

interface IRequestedCheckboxProps {
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

export default function RequestedCheckbox(props: IRequestedCheckboxProps) {
  const { service, idx, noteId, services, setServices } = props;
  const [isChecked, setIsChecked] = useState(false);
  const [id, setId] = useState<string | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);

  const [createNoteServiceRequest] = useMutation<
    CreateNoteServiceRequestMutation,
    CreateNoteServiceRequestMutationVariables
  >(CREATE_NOTE_SERVICE_REQUEST);
  const [deleteServiceRequest] = useMutation<
    DeleteServiceRequestMutation,
    DeleteServiceRequestMutationVariables
  >(DELETE_SERVICE_REQUEST);

  const toggleService = useCallback(() => {
    const executeMutation = async () => {
      if (!noteId) return;
      if (isChecked) {
        createNoteServiceRequest({
          variables: {
            data: {
              service: service.enum,
              noteId,
              serviceRequestType: ServiceRequestTypeEnum.Requested,
            },
          },
        })
          .then((response) => {
            if (
              response.data?.createNoteServiceRequest.__typename ===
              'ServiceRequestType'
            ) {
              const createdServiceId =
                response.data?.createNoteServiceRequest.id;
              if (createdServiceId) {
                setId(createdServiceId);
                setIsLoading(false);
              }
            } else if (
              response.data?.createNoteServiceRequest.__typename ===
              'OperationInfo'
            ) {
              console.log(response.data.createNoteServiceRequest.messages);
            }
          })
          .catch((error) => {
            console.error('Error creating service', error);
          });
      } else {
        if (id) {
          deleteServiceRequest({
            variables: {
              data: {
                id,
              },
            },
          })
            .then(() => {
              setId(undefined);
              setIsLoading(false);
            })
            .catch((error) => {
              console.error('Error deleting service', error);
            });
        }
      }
    };

    debounce(executeMutation, 500)();
  }, [
    isChecked,
    noteId,
    service.enum,
    createNoteServiceRequest,
    deleteServiceRequest,
  ]);

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
  };

  useEffect(() => {
    const debouncedToggle = debounce(toggleService, 300);
    debouncedToggle();
  }, [toggleService]);

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
