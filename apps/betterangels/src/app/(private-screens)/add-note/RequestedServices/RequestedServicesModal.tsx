import {
  Modal,
  OtherCategory,
  ServiceEnum,
  ServiceRequestTypeEnum,
  Services,
  useCreateNoteServiceRequestMutation,
  useDeleteServiceRequestMutation,
} from '@monorepo/expo/betterangels';
import { Colors, Spacings } from '@monorepo/expo/shared/static';
import {
  Button,
  TextBold,
  TextRegular,
} from '@monorepo/expo/shared/ui-components';
import { useEffect, useState } from 'react';
import { ScrollView, View } from 'react-native';
import RequestedCheckbox from './RequestedCheckbox';

interface IRequestedServicesModalProps {
  setIsModalVisible: (isModalVisible: boolean) => void;
  isModalVisible: boolean;
  noteId: string;
  initialServices: {
    id: string;
    service: ServiceEnum;
    serviceOther?: string | null;
  }[];
  refetch: () => void;
}

export default function RequestedServicesModal(
  props: IRequestedServicesModalProps
) {
  const {
    setIsModalVisible,
    isModalVisible,
    initialServices,
    noteId,
    refetch,
  } = props;

  const [services, setServices] = useState<
    Array<{
      id: string | undefined;
      enum: ServiceEnum | null;
      markedForDeletion?: boolean;
    }>
  >([]);

  const [serviceOthers, setServiceOthers] = useState<
    { title: string | null; id: string | undefined }[]
  >([]);

  const [deleteServiceRequest] = useDeleteServiceRequestMutation();
  const [createServiceRequest] = useCreateNoteServiceRequestMutation();

  const reset = async () => {
    try {
      const deleteServices = services.map((service) => ({
        ...service,
        enum: null,
        markedForDeletion: true,
      }));
      const deleteServiceOthers = serviceOthers.map((service) => ({
        ...service,
        title: null,
      }));

      setServices(deleteServices);
      setServiceOthers(deleteServiceOthers);
    } catch (e) {
      console.error(e);
    }
  };

  const submitServices = async () => {
    const toCreateServices = services.filter(
      (service) =>
        service.enum !== null && !service.id && !service.markedForDeletion
    );

    const toRemoveServices = services.filter(
      (service) => service.markedForDeletion && !!service.id
    );

    try {
      for (const service of toRemoveServices) {
        if (service.id) {
          try {
            await deleteServiceRequest({
              variables: {
                data: {
                  id: service.id,
                },
              },
            });
          } catch (error) {
            console.error(
              `Error deleting service with id ${service.id}:`,
              error
            );
          }
        }
      }

      for (const service of toCreateServices) {
        if (service.enum) {
          try {
            await createServiceRequest({
              variables: {
                data: {
                  service: service.enum,
                  noteId,
                  serviceRequestType: ServiceRequestTypeEnum.Requested,
                },
              },
            });
          } catch (error) {
            console.error(
              `Error creating service with enum ${service.enum}:`,
              error
            );
          }
        }
      }

      refetch();
      setIsModalVisible(false);
    } catch (e) {
      console.error('Error during service submission:', e);
    }
  };

  const closeModal = () => {
    const newInitialServices = initialServices
      .filter((item) => item.service !== ServiceEnum.Other)
      .map((service) => ({ id: service.id, enum: service.service }));
    const initialServiceOthers = initialServices
      .filter((item) => item.service === ServiceEnum.Other)
      .map((service) => ({
        id: service.id,
        title: service.serviceOther || '',
      }));
    setIsModalVisible(false);
    setServiceOthers(initialServiceOthers);
    setServices(newInitialServices);
  };

  useEffect(() => {
    const newInitialServices = initialServices
      .filter((item) => item.service !== ServiceEnum.Other)
      .map((service) => ({ id: service.id, enum: service.service }));
    const initialServiceOthers = initialServices
      .filter((item) => item.service === ServiceEnum.Other)
      .map((service) => ({
        id: service.id,
        title: service.serviceOther || '',
      }));

    setServiceOthers(initialServiceOthers);
    setServices(newInitialServices);
  }, [initialServices]);

  return (
    <Modal
      mt={Spacings.sm}
      vertical
      closeButton
      closeModal={closeModal}
      isModalVisible={isModalVisible}
    >
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          gap: Spacings.sm,
          paddingBottom: Spacings.md,
        }}
        style={{ paddingHorizontal: Spacings.md }}
      >
        <TextBold>Requested Services</TextBold>
        <TextRegular mt="xxs" mb="sm">
          Select the services Requested to your client in this interaction.
        </TextRegular>
        {Services.map((service) => (
          <View key={service.title}>
            <TextBold mb="xs">{service.title}</TextBold>
            {service.items.map((item, idx) => {
              const serviceId = services?.find((s) => s.enum === item.enum)?.id;
              return (
                <RequestedCheckbox
                  id={serviceId}
                  key={item.enum}
                  services={services}
                  setServices={setServices}
                  noteId={noteId}
                  service={item}
                  idx={idx}
                />
              );
            })}
          </View>
        ))}
        <View>
          <TextBold>Other</TextBold>
          <OtherCategory
            noteId={noteId}
            setServices={setServiceOthers}
            serviceType={ServiceRequestTypeEnum.Requested}
            services={serviceOthers}
          />
        </View>
      </ScrollView>

      <View
        style={{
          flexDirection: 'row',
          gap: Spacings.xs,
          width: '100%',
          paddingTop: Spacings.sm,
          alignItems: 'center',
          paddingHorizontal: Spacings.md,
          backgroundColor: Colors.WHITE,
          shadowColor: Colors.BLACK,
          shadowOffset: {
            width: 0,
            height: -5,
          },
          shadowOpacity: 0.05,
          shadowRadius: 3.84,
          elevation: 1,
        }}
      >
        <View style={{ flex: 1 }}>
          <Button
            onPress={reset}
            size="full"
            variant="secondary"
            title="Reset"
            accessibilityHint="resets all requested checkboxes"
          />
        </View>
        <View style={{ flex: 1 }}>
          <Button
            onPress={submitServices}
            size="full"
            variant="primary"
            title="Done"
            accessibilityHint="closes requested services modal"
          />
        </View>
      </View>
    </Modal>
  );
}
