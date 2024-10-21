import {
  Modal,
  OtherCategory,
  ServiceEnum,
  ServiceRequestTypeEnum,
  Services,
  useDeleteServiceRequestMutation,
} from '@monorepo/expo/betterangels';
import { Colors, Spacings } from '@monorepo/expo/shared/static';
import {
  Button,
  TextBold,
  TextRegular,
} from '@monorepo/expo/shared/ui-components';
import { SetStateAction, useEffect, useState } from 'react';
import { ScrollView, View } from 'react-native';
import ProvidedCheckbox from './ProvidedCheckbox';

interface IProvidedServicesModalProps {
  closeModal: () => void;
  isModalVisible: boolean;
  noteId?: string;
  refetch: () => void;
  initialServices:
    | {
        id: string;
        service: ServiceEnum;
        serviceOther?: string | null;
      }[];
}

export default function ProvidedServicesModal(
  props: IProvidedServicesModalProps
) {
  const { closeModal, isModalVisible, initialServices, noteId, refetch } =
    props;

  const [deleteServiceRequest] = useDeleteServiceRequestMutation();

  const [services, setServices] = useState<
    Array<{
      id: string | undefined;
      enum: ServiceEnum;
    }>
  >([]);

  const [serviceOthers, setServiceOthers] = useState<
    { title: string; id: string | undefined }[]
  >([]);

  useEffect(() => {
    if (!initialServices.length) return;

    const newServices: SetStateAction<
      { id: string | undefined; enum: ServiceEnum }[] | undefined
    > = [];
    const newServiceOthers: SetStateAction<
      { title: string; id: string | undefined }[] | undefined
    > = [];

    initialServices.forEach((service) => {
      if (service.service === 'OTHER') {
        newServiceOthers.push({
          id: service.id,
          title: service.serviceOther || '',
        });
      } else {
        newServices.push({
          id: service.id,
          enum: service.service,
        });
      }
    });

    if (newServices.length > 0 || services?.length !== newServices.length) {
      setServices(newServices);
    }

    if (
      newServiceOthers.length > 0 ||
      serviceOthers?.length !== newServiceOthers.length
    ) {
      setServiceOthers(newServiceOthers);
    }
  }, [initialServices]);

  const reset = async () => {
    try {
      const servicesToDelete = [...services, ...serviceOthers];

      const deletePromises = servicesToDelete
        .filter(
          (service): service is { id: string; enum: ServiceEnum } =>
            !!service.id
        )
        .map((service) =>
          deleteServiceRequest({
            variables: {
              data: {
                id: service.id,
              },
            },
          })
        );

      await Promise.all(deletePromises);

      setServices([]);
      setServiceOthers([]);

      refetch();
    } catch (e) {
      console.error(e);
    }
  };

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
        }}
        style={{ paddingHorizontal: Spacings.md }}
      >
        <TextBold>Provided Services</TextBold>
        <TextRegular mt="xxs" mb="sm">
          Select the services provided to your client in this interaction.
        </TextRegular>
        {Services.map((service) => (
          <View key={service.title}>
            <TextBold mb="xs">{service.title}</TextBold>
            {service.items.map((item, idx) => {
              const serviceId = services?.find((s) => s.enum === item.enum)?.id;
              return (
                <ProvidedCheckbox
                  key={item.enum}
                  services={services}
                  setServices={setServices}
                  noteId={noteId}
                  id={serviceId}
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
            serviceType={ServiceRequestTypeEnum.Provided}
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
            onPress={closeModal}
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
