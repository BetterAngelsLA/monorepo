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
  ServiceRequestTypeEnum,
  useCreateNoteServiceRequestMutation,
  useDeleteServiceRequestMutation,
} from '../../apollo';
import { useSnackbar } from '../../hooks';
import { useModalScreen } from '../../providers';
import MainScrollContainer from '../MainScrollContainer';
import OtherCategory from './OtherCategory';
import ServiceCheckbox from './ServiceCheckbox';
import {
  ServiceCategoriesQuery,
  useServiceCategoriesQuery,
} from './__generated__/services.generated';

type ApiCategory =
  ServiceCategoriesQuery['serviceCategories']['results'][number];

type TItem = { id: string; label: string };
type TCategory = { title: string; items: TItem[] };

type SelectedService = {
  requestId?: string;
  serviceId: string;
  label: string;
  markedForDeletion?: boolean;
};

interface IServicesModalProps {
  noteId: string;
  initialServices: {
    id: string;
    service?: {
      label?: string;
      id: string;
    } | null;
    serviceOther?: string | null;
  }[];
  refetch: () => void;
  type: ServiceRequestTypeEnum.Provided | ServiceRequestTypeEnum.Requested;
}

export default function ServicesModal(props: IServicesModalProps) {
  const { initialServices, noteId, refetch, type } = props;

  const { data: availableCategories } = useServiceCategoriesQuery();
  const { closeModalScreen } = useModalScreen();
  const { top: topInset, bottom: bottomInset } = useSafeAreaInsets();
  const [services, setServices] = useState<SelectedService[]>([]);

  const [serviceOthers, setServiceOthers] = useState<
    {
      serviceOther: string | null;
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

  function filterServicesByText(
    categories: TCategory[],
    searchText: string
  ): TCategory[] {
    const q = searchText.trim().toLowerCase();
    if (!q) return categories;
    return categories
      .map((cat) => ({
        ...cat,
        items: cat.items.filter((item) => item.label.toLowerCase().includes(q)),
      }))
      .filter((cat) => cat.items.length > 0);
  }

  function toServicesByCategory(categories: ApiCategory[]): TCategory[] {
    return [...categories]
      .sort(
        (a, b) =>
          (a.priority ?? 0) - (b.priority ?? 0) || a.name.localeCompare(b.name)
      )
      .map((cat) => ({
        title: cat.name,
        items: [...(cat.services ?? [])]
          .sort(
            (a, b) =>
              (a.priority ?? 0) - (b.priority ?? 0) ||
              a.label.localeCompare(b.label)
          )
          .map((s) => ({ id: s.id, label: s.label })),
      }));
  }

  const categories = toServicesByCategory(
    availableCategories?.serviceCategories?.results ?? []
  );
  const filteredServices = filterServicesByText(categories, searchText);
  const hasResults = filteredServices.some((c) => c.items.length > 0);

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
    try {
      const toCreate = services.filter(
        (s) => !s.requestId && !s.markedForDeletion
      );

      for (const s of toCreate) {
        await createService({
          variables: {
            data: {
              serviceId: s.serviceId,
              noteId,
              serviceRequestType: type,
            },
          },
        });
      }

      const toDelete = services.filter(
        (s) => s.requestId && s.markedForDeletion
      );
      for (const s of toDelete) {
        await deleteService({ variables: { data: { id: s.requestId! } } });
      }

      const toCreateOtherServices = serviceOthers.filter(
        (service) =>
          service.serviceOther !== null &&
          !service.id &&
          !service.markedForDeletion
      );

      for (const service of toCreateOtherServices) {
        await createService({
          variables: {
            data: {
              serviceOther: service.serviceOther,
              noteId,
              serviceRequestType: type,
            },
          },
        });
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
    const existing: SelectedService[] = initialServices
      .filter((it) => it.service?.id)
      .map((it) => ({
        requestId: it.id,
        serviceId: it.service!.id,
        label: it.service?.label ?? '',
      }));

    setServices(existing);
    setServiceOthers([]);
    closeModalScreen();
  };

  useEffect(() => {
    const existing: SelectedService[] = initialServices
      .filter((it) => it.service?.id)
      .map((it) => ({
        requestId: it.id,
        serviceId: it.service!.id,
        label: it.service?.label ?? '',
      }));

    setServices(existing);
  }, [initialServices]);

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
            filteredServices.map((service) =>
              service.items.length > 0 ? (
                <View key={service.title}>
                  <TextBold mb="xs">{service.title}</TextBold>
                  {service.items.map((item, idx) => {
                    return (
                      <ServiceCheckbox
                        key={item.id}
                        services={services}
                        setServices={setServices}
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
              setServices={setServiceOthers}
              services={serviceOthers}
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
