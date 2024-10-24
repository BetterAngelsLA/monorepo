import { SearchIcon } from '@monorepo/expo/shared/icons';
import { Colors, Spacings } from '@monorepo/expo/shared/static';
import {
  BasicInput,
  Button,
  TextBold,
  TextRegular,
} from '@monorepo/expo/shared/ui-components';
import { useEffect, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import {
  ServiceEnum,
  ServiceRequestTypeEnum,
  useCreateNoteServiceRequestMutation,
  useDeleteServiceRequestMutation,
} from '../../apollo';
import { useSnackbar } from '../../hooks';
import { ServicesByCategory } from '../../static';
import Modal from '../Modal';
import OtherCategory from './OtherCategory';
import ServiceCheckbox from './ServiceCheckbox';

interface IServicesModalProps {
  setIsModalVisible: (isModalVisible: boolean) => void;
  isModalVisible: boolean;
  noteId: string;
  initialServices: {
    id: string;
    service: ServiceEnum;
    serviceOther?: string | null;
  }[];
  refetch: () => void;
  type: ServiceRequestTypeEnum.Provided | ServiceRequestTypeEnum.Requested;
}

export default function ServicesModal(props: IServicesModalProps) {
  const {
    setIsModalVisible,
    isModalVisible,
    initialServices,
    noteId,
    refetch,
    type,
  } = props;

  const [services, setServices] = useState<
    Array<{
      id: string | undefined;
      enum: ServiceEnum | null;
      markedForDeletion?: boolean;
    }>
  >([]);

  const [serviceOthers, setServiceOthers] = useState<
    {
      title: string | null;
      id: string | undefined;
      markedForDeletion?: boolean;
    }[]
  >([]);
  const [isSubmitLoading, setIsSubmitLoading] = useState(false);

  const [searchText, setSearchText] = useState('');

  const [deleteService] = useDeleteServiceRequestMutation();
  const [createService] = useCreateNoteServiceRequestMutation();
  const { showSnackbar } = useSnackbar();

  const handleFilter = (text: string) => {
    setSearchText(text);
  };

  const filteredServices = ServicesByCategory.map((category) => ({
    ...category,
    items: category.items.filter((item) =>
      item.toLowerCase().includes(searchText.toLowerCase())
    ),
  }));

  const reset = async () => {
    try {
      const deleteServices = services.map((service) => ({
        ...service,
        markedForDeletion: true,
      }));
      const deleteServiceOthers = serviceOthers.map((service) => ({
        ...service,
        markedForDeletion: true,
      }));

      setServices(deleteServices);
      setServiceOthers(deleteServiceOthers);
    } catch (e) {
      console.error(e);
    }
  };

  const submitServices = async () => {
    setIsSubmitLoading(true);
    const toCreateOtherServices = serviceOthers.filter(
      (service) =>
        service.title !== null && !service.id && !service.markedForDeletion
    );
    const toCreateServices = services.filter(
      (service) =>
        service.enum !== null && !service.id && !service.markedForDeletion
    );

    const toRemoveOtherServices = serviceOthers.filter(
      (service) => service.markedForDeletion && !!service.id
    );

    const toRemoveServices = services.filter(
      (service) => service.markedForDeletion && !!service.id
    );

    const toRemoveServicesWithOther = [
      ...toRemoveOtherServices,
      ...toRemoveServices,
    ];

    try {
      for (const service of toRemoveServicesWithOther) {
        if (service.id) {
          try {
            await deleteService({
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
            await createService({
              variables: {
                data: {
                  service: service.enum,
                  noteId,
                  serviceRequestType: type,
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

      for (const service of toCreateOtherServices) {
        if (service.title) {
          try {
            await createService({
              variables: {
                data: {
                  service: ServiceEnum.Other,
                  serviceOther: service.title,
                  noteId,
                  serviceRequestType: type,
                },
              },
            });
          } catch (error) {
            console.error(
              `Error creating service with title ${service.title}:`,
              error
            );
          }
        }
      }

      refetch();
      setIsModalVisible(false);
    } catch (e) {
      console.error('Error during service submission:', e);
      showSnackbar({
        message: 'Sorry, there was an error updating the services.',
        type: 'error',
      });
    } finally {
      setIsSubmitLoading(false);
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
        title: service.serviceOther || null,
      }));
    setIsModalVisible(false);
    setServiceOthers(initialServiceOthers);
    setServices(newInitialServices);
  };

  useEffect(() => {
    const newInitialServices = initialServices
      .filter((serviceItem) => serviceItem.service !== ServiceEnum.Other)
      .map((serviceItem) => ({
        id: serviceItem.id,
        enum: serviceItem.service,
      }));
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
      <KeyboardAwareScrollView
        style={{
          flex: 1,
          backgroundColor: Colors.WHITE,
        }}
        keyboardShouldPersistTaps="handled"
      >
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            gap: Spacings.sm,
            paddingBottom: Spacings.md,
          }}
          style={{ paddingHorizontal: Spacings.md }}
        >
          <View>
            <TextBold size="lg">
              {type === 'PROVIDED' ? 'Provided Services' : 'Requested Services'}
            </TextBold>
            <TextRegular mt="xxs" mb="sm">
              Select the services to your client in this interaction.
            </TextRegular>
          </View>
          <BasicInput
            value={searchText}
            onDelete={() => setSearchText('')}
            onChangeText={handleFilter}
            placeholder="Search a service"
            icon={<SearchIcon color={Colors.NEUTRAL} />}
          />
          {filteredServices.map((service) =>
            service.items.length > 0 ? (
              <View key={service.title}>
                <TextBold mb="xs">{service.title}</TextBold>
                {service.items.map((item, idx) => {
                  return (
                    <ServiceCheckbox
                      key={item}
                      services={services}
                      setServices={setServices}
                      service={item}
                      idx={idx}
                    />
                  );
                })}
              </View>
            ) : null
          )}
          <View>
            <TextBold>Other</TextBold>
            <OtherCategory
              setServices={setServiceOthers}
              services={serviceOthers}
            />
          </View>
        </ScrollView>
      </KeyboardAwareScrollView>

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
            accessibilityHint="resets all  checkboxes"
          />
        </View>
        <View style={{ flex: 1 }}>
          <Button
            disabled={isSubmitLoading}
            loading={isSubmitLoading}
            onPress={submitServices}
            size="full"
            variant="primary"
            title="Done"
            accessibilityHint="closes  services modal"
          />
        </View>
      </View>
    </Modal>
  );
}
