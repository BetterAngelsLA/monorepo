import {
    OtherCategory,
    ServiceEnum,
    ServiceRequestTypeEnum,
    ServicesByCategory,
    useCreateNoteServiceRequestMutation,
    useDeleteServiceRequestMutation,
    useSnackbar
} from '@monorepo/expo/betterangels';
import { FileSearchIcon, SearchIcon } from '@monorepo/expo/shared/icons';
import { Colors, Spacings } from '@monorepo/expo/shared/static';
import {
    BaseModalLayout,
    BasicInput,
    TextBold,
    TextRegular,
} from '@monorepo/expo/shared/ui-components';
import { useLocalSearchParams, useRouter } from 'expo-router';
import ServiceCheckbox from 'libs/expo/betterangels/src/lib/ui-components/RequestedProvidedServices/ServiceCheckbox';
import React, { useState } from 'react';
import { View } from 'react-native';

export default function ProvidedServicesModalScreen() {
    const router = useRouter();
    const { noteId, type } = useLocalSearchParams();
    const { showSnackbar } = useSnackbar();

    const [services, setServices] = useState<Array<{
      id: string | undefined;
      enum: ServiceEnum | null;
      markedForDeletion?: boolean;
    }>>([]);

    const [serviceOthers, setServiceOthers] = useState<{
      title: string | null;
      id: string | undefined;
      markedForDeletion?: boolean;
    }[]>([]);

    const [isSubmitLoading, setIsSubmitLoading] = useState(false);
    const [searchText, setSearchText] = useState('');

    const [deleteService] = useDeleteServiceRequestMutation();
    const [createService] = useCreateNoteServiceRequestMutation();

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
      setServices((prev) => prev.map((s) => ({ ...s, markedForDeletion: true })));
      setServiceOthers((prev) => prev.map((s) => ({ ...s, markedForDeletion: true })));
    };

    const submitServices = async () => {
      setIsSubmitLoading(true);

      const toCreateOtherServices = serviceOthers.filter(
        (s) => s.title && !s.id && !s.markedForDeletion
      );
      const toCreateServices = services.filter(
        (s) => s.enum && !s.id && !s.markedForDeletion
      );

      const toRemoveOtherServices = serviceOthers.filter(
        (s) => s.markedForDeletion && s.id
      );
      const toRemoveServices = services.filter(
        (s) => s.markedForDeletion && s.id
      );

      const toRemoveAll = [...toRemoveOtherServices, ...toRemoveServices];

      try {
        for (const s of toRemoveAll) {
          if (s.id) {
            try {
              await deleteService({ variables: { data: { id: s.id } } });
            } catch (error) {
              console.error(`Error deleting service with id ${s.id}:`, error);
            }
          }
        }

        for (const s of toCreateServices) {
          try {
            await createService({
              variables: {
                data: {
                  service: s.enum!,
                  noteId: String(noteId),
                  serviceRequestType:
                    type === 'REQUESTED'
                      ? ServiceRequestTypeEnum.Requested
                      : ServiceRequestTypeEnum.Provided,
                },
              },
            });
          } catch (error) {
            console.error(`Error creating service with enum ${s.enum}:`, error);
          }
        }

        for (const s of toCreateOtherServices) {
          try {
            await createService({
              variables: {
                data: {
                  service: ServiceEnum.Other,
                  serviceOther: s.title!,
                  noteId: String(noteId),
                  serviceRequestType:
                    type === 'REQUESTED'
                      ? ServiceRequestTypeEnum.Requested
                      : ServiceRequestTypeEnum.Provided,
                },
              },
            });
          } catch (error) {
            console.error(`Error creating service with title ${s.title}:`, error);
          }
        }

        router.back();
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

    const hasResults = filteredServices.some((cat) => cat.items.length > 0);

    return (
      <BaseModalLayout
        title={type === 'REQUESTED' ? 'Requested Services' : 'Provided Services'}
        subtitle="Select the services to your client in this interaction."
        scrollable
        onReset={reset}
        onSubmit={submitServices}
        isSubmitting={isSubmitLoading}
        submitAccessibilityHint="Submit selected services and close modal"
        resetAccessibilityHint="Mark all selected services for deletion"
      >
        <BasicInput
          value={searchText}
          onDelete={() => setSearchText('')}
          onChangeText={handleFilter}
          placeholder="Search a service"
          icon={<SearchIcon color={Colors.NEUTRAL} />}
        />

        {hasResults ? (
          filteredServices.map((service) => (
            <View key={service.title}>
              <TextBold mb="xs">{service.title}</TextBold>
              {service.items.map((item, idx) => (
                <ServiceCheckbox
                  key={item}
                  services={services}
                  setServices={setServices}
                  service={item}
                  idx={idx}
                />
              ))}
            </View>
          ))
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
            <TextBold mb="xs" size="sm">No Results</TextBold>
            <TextRegular size="sm">Try searching for something else.</TextRegular>
          </View>
        )}

        <TextBold>Other</TextBold>
        <OtherCategory setServices={setServiceOthers} services={serviceOthers} />
      </BaseModalLayout>
    );
  }
