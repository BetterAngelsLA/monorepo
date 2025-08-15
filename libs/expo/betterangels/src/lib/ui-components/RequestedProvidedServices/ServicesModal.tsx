import {
  FileSearchIcon,
  PlusIcon,
  SearchIcon,
} from '@monorepo/expo/shared/icons';
import { Colors, Spacings } from '@monorepo/expo/shared/static';
import {
  BasicInput,
  Button,
  TextBold,
  TextRegular,
} from '@monorepo/expo/shared/ui-components';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ServiceEnum,
  ServiceRequestTypeEnum,
  useCreateNoteServiceRequestMutation,
  useDeleteServiceRequestMutation,
} from '../../apollo';
import { useSnackbar } from '../../hooks';
import { useModalScreen } from '../../providers';
import { ServicesByCategory } from '../../static';
import MainScrollContainer from '../MainScrollContainer';
import OtherCategory from './OtherCategory';
import ServiceRequestCheckbox from './ServiceRequestCheckbox';

interface IServicesModalProps {
  noteId: string;
  initialServiceRequests: {
    id: string;
    service?: ServiceEnum | null | undefined;
    serviceEnum?: ServiceEnum | null | undefined;
    serviceOther?: string | null;
  }[];
  refetch: () => void;
  type: ServiceRequestTypeEnum.Provided | ServiceRequestTypeEnum.Requested;
}

export default function ServicesModal(props: IServicesModalProps) {
  const { initialServiceRequests, noteId, refetch, type } = props;

  const { closeModalScreen } = useModalScreen();
  const { top: topInset, bottom: bottomInset } = useSafeAreaInsets();
  const [serviceRequests, setServiceRequests] = useState<
    Array<{
      id: string | undefined;
      enum: ServiceEnum | null;
      markedForDeletion?: boolean;
    }>
  >([]);

  const [serviceRequestOthers, setServiceRequestOthers] = useState<
    {
      title: string | null;
      id: string | undefined;
      markedForDeletion?: boolean;
    }[]
  >([]);
  const [isSubmitLoading, setIsSubmitLoading] = useState(false);
  const [searchText, setSearchText] = useState('');

  const [deleteServiceRequest] = useDeleteServiceRequestMutation();
  const [createServiceRequest] = useCreateNoteServiceRequestMutation();
  const { showSnackbar } = useSnackbar();

  const handleFilter = (text: string) => {
    setSearchText(text);
  };

  const filteredServiceRequests = ServicesByCategory.map((category) => ({
    ...category,
    items: category.items.filter((item) =>
      item.toLowerCase().includes(searchText.toLowerCase())
    ),
  }));

  const reset = async () => {
    try {
      const deleteServiceRequests = serviceRequests.map((serviceRequest) => ({
        ...serviceRequest,
        markedForDeletion: true,
      }));
      const deleteServiceRequestOthers = serviceRequestOthers.map(
        (serviceRequest) => ({
          ...serviceRequest,
          markedForDeletion: true,
        })
      );

      setServiceRequests(deleteServiceRequests);
      setServiceRequestOthers(deleteServiceRequestOthers);
    } catch (e) {
      console.error(e);
    }
  };

  const submitServices = async () => {
    setIsSubmitLoading(true);
    const toCreateOtherServiceRequests = serviceRequestOthers.filter(
      (serviceRequest) =>
        serviceRequest.title !== null &&
        !serviceRequest.id &&
        !serviceRequest.markedForDeletion
    );
    const toCreateServices = serviceRequests.filter(
      (serviceRequest) =>
        serviceRequest.enum !== null &&
        !serviceRequest.id &&
        !serviceRequest.markedForDeletion
    );

    const toRemoveOtherServices = serviceRequestOthers.filter(
      (serviceRequest) =>
        serviceRequest.markedForDeletion && !!serviceRequest.id
    );

    const toRemoveServices = serviceRequests.filter(
      (serviceRequest) =>
        serviceRequest.markedForDeletion && !!serviceRequest.id
    );

    const toRemoveServicesWithOther = [
      ...toRemoveOtherServices,
      ...toRemoveServices,
    ];

    try {
      for (const serviceRequest of toRemoveServicesWithOther) {
        if (serviceRequest.id) {
          try {
            await deleteServiceRequest({
              variables: {
                data: {
                  id: serviceRequest.id,
                },
              },
            });
          } catch (error) {
            console.error(
              `Error deleting service with id ${serviceRequest.id}:`,
              error
            );
          }
        }
      }

      for (const serviceRequest of toCreateServices) {
        if (serviceRequest.enum) {
          try {
            await createServiceRequest({
              variables: {
                data: {
                  serviceEnum: serviceRequest.enum,
                  noteId,
                  serviceRequestType: type,
                },
              },
            });
          } catch (error) {
            console.error(
              `Error creating service with enum ${serviceRequest.enum}:`,
              error
            );
          }
        }
      }

      for (const serviceRequest of toCreateOtherServiceRequests) {
        if (serviceRequest.title) {
          try {
            await createServiceRequest({
              variables: {
                data: {
                  serviceEnum: ServiceEnum.Other,
                  serviceOther: serviceRequest.title,
                  noteId,
                  serviceRequestType: type,
                },
              },
            });
          } catch (error) {
            console.error(
              `Error creating service with title ${serviceRequest.title}:`,
              error
            );
          }
        }
      }

      refetch();
      closeModalScreen();
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
    const newInitialServices = initialServiceRequests
      // TODO: remove after cutover
      .filter((serviceRequest) => !!serviceRequest.serviceEnum)
      .filter(
        (serviceRequest) => serviceRequest.serviceEnum !== ServiceEnum.Other
      )
      .map((serviceRequest) => ({
        id: serviceRequest.id,
        enum: serviceRequest.serviceEnum!,
      }));
    const initialServiceRequestOthers = initialServiceRequests
      .filter(
        (serviceRequest) => serviceRequest.serviceEnum === ServiceEnum.Other
      )
      .map((serviceRequest) => ({
        id: serviceRequest.id,
        title: serviceRequest.serviceOther || null,
      }));
    setServiceRequestOthers(initialServiceRequestOthers);
    setServiceRequests(newInitialServices);

    closeModalScreen();
  };

  useEffect(() => {
    const newInitialServices = initialServiceRequests
      // TODO: remove after cutover
      .filter((serviceRequest) => !!serviceRequest.serviceEnum)
      .filter(
        (serviceRequest) => serviceRequest.serviceEnum !== ServiceEnum.Other
      )
      .map((serviceRequest) => ({
        id: serviceRequest.id,
        enum: serviceRequest.serviceEnum!,
      }));
    const initialServiceRequestOthers = initialServiceRequests
      .filter(
        (serviceRequest) => serviceRequest.serviceEnum === ServiceEnum.Other
      )
      .map((serviceRequest) => ({
        id: serviceRequest.id,
        title: serviceRequest.serviceOther || '',
      }));

    setServiceRequestOthers(initialServiceRequestOthers);
    setServiceRequests(newInitialServices);
  }, [initialServiceRequests]);

  const hasResults = filteredServiceRequests.some(
    (category) => category.items.length > 0
  );
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: Colors.WHITE,
        paddingTop: topInset,
      }}
    >
      <View
        style={{
          alignItems: 'flex-end',
          paddingHorizontal: 24,
          marginBottom: 4,
        }}
      >
        <Pressable
          accessible
          accessibilityHint="closes the modal"
          accessibilityRole="button"
          accessibilityLabel="close"
          onPress={closeModal}
        >
          <PlusIcon size="md" color={Colors.BLACK} rotate="45deg" />
        </Pressable>
      </View>
      <MainScrollContainer keyboardAware>
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            gap: Spacings.sm,
            paddingBottom: Spacings.md,
          }}
          style={{ paddingHorizontal: Spacings.xs }} // Reduced from Spacings.md
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
          {hasResults ? (
            filteredServiceRequests.map((serviceRequest) =>
              serviceRequest.items.length > 0 ? (
                <View key={serviceRequest.title}>
                  <TextBold mb="xs">{serviceRequest.title}</TextBold>
                  {serviceRequest.items.map((item, idx) => {
                    return (
                      <ServiceRequestCheckbox
                        key={item}
                        serviceRequests={serviceRequests}
                        setServiceRequests={setServiceRequests}
                        service={item}
                        idx={idx}
                      />
                    );
                  })}
                </View>
              ) : null
            )
          ) : (
            <View style={{ alignItems: 'center' }}>
              <View
                style={{
                  height: 90,
                  width: 90,
                  backgroundColor: Colors.PRIMARY_EXTRA_LIGHT,
                  borderRadius: 100,
                  marginBottom: Spacings.md,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <FileSearchIcon size="2xl" />
              </View>
              <TextBold mb="xs" size="sm">
                No Results
              </TextBold>
              <TextRegular size="sm">
                Try searching for something else.
              </TextRegular>
            </View>
          )}

          <View>
            <TextBold>Other</TextBold>
            <OtherCategory
              setServiceRequests={setServiceRequestOthers}
              serviceRequests={serviceRequestOthers}
            />
          </View>
        </ScrollView>
      </MainScrollContainer>

      <View
        style={{
          flexDirection: 'row',
          gap: Spacings.xs,
          width: '100%',
          paddingTop: Spacings.sm,
          paddingBottom: bottomInset + Spacings.lg,
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
    </View>
  );
}
