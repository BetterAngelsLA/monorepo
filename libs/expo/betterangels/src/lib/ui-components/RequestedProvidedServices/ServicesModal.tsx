import { useCallback, useEffect, useMemo, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { pipe, filter as rfilter, find as rfind, map as rmap } from 'remeda';

import { FileSearchIcon, SearchIcon } from '@monorepo/expo/shared/icons';
import { Colors, Spacings } from '@monorepo/expo/shared/static';
import {
  BasicInput,
  Button,
  TextBold,
  TextRegular,
} from '@monorepo/expo/shared/ui-components';

import {
  CreateNoteServiceRequestDocument,
  DeleteServiceRequestDocument,
  ServiceRequestTypeEnum,
} from '../../apollo';
import { useSnackbar } from '../../hooks';

import MainScrollContainer from '../MainScrollContainer';
import OtherCategory from './OtherCategory';
import ServiceCheckbox from './ServiceCheckbox';

import { useMutation, useQuery } from '@apollo/client/react';
import {
  ServiceCategoriesDocument,
  ServiceCategoriesQuery,
} from './__generated__/services.generated';

type ApiCategory =
  ServiceCategoriesQuery['serviceCategories']['results'][number];

type ApiService = NonNullable<ApiCategory['services']>[number];

type TItem = { id: string; label: string };
type TCategory = { title: string; items: TItem[] };

type SelectedService = {
  /** present if the service request already exists on the server */
  serviceRequestId?: string;
  serviceId: string;
  label: string;
  /** if true (and serviceRequestId exists), delete on submit */
  markedForDeletion?: boolean;
};

interface IServicesModalProps {
  noteId: string;
  initialServiceRequests: {
    id: string;
    service?: { label?: string; id: string } | null;
    serviceOther?: string | null;
  }[];
  refetch: () => void;
  close: () => void;
  type: ServiceRequestTypeEnum.Provided | ServiceRequestTypeEnum.Requested;
}

export default function ServicesModal(props: IServicesModalProps) {
  const { initialServiceRequests, noteId, refetch, type, close } = props;

  const { data: availableCategories } = useQuery(ServiceCategoriesDocument);
  const { showSnackbar } = useSnackbar();
  const { bottom: bottomInset } = useSafeAreaInsets();

  const [serviceRequests, setServiceRequests] = useState<SelectedService[]>([]);
  const [serviceRequestsOthers, setServiceRequestsOthers] = useState<
    {
      serviceOther: string | null;
      serviceRequestId: string | undefined;
      markedForDeletion?: boolean;
    }[]
  >([]);
  const [isSubmitLoading, setIsSubmitLoading] = useState(false);
  const [searchText, setSearchText] = useState('');

  const [deleteService] = useMutation(DeleteServiceRequestDocument);
  const [createServiceRequest] = useMutation(CreateNoteServiceRequestDocument);

  // ---------- Pure helpers (native sort + Remeda for map/filter/find) ----------
  const sortCategories = (arr: ApiCategory[]) =>
    [...arr].sort(
      (a, b) =>
        (a.priority ?? 0) - (b.priority ?? 0) ||
        a.name.toLowerCase().localeCompare(b.name.toLowerCase())
    );

  const sortServices = (arr: ApiService[]) =>
    [...arr].sort(
      (a, b) =>
        (a.priority ?? 0) - (b.priority ?? 0) ||
        a.label.toLowerCase().localeCompare(b.label.toLowerCase())
    );

  const toServicesByCategory = useCallback(
    (categories: ApiCategory[]): TCategory[] =>
      pipe(
        sortCategories(categories),
        rmap(
          (cat: ApiCategory): TCategory => ({
            title: cat.name,
            items: pipe(
              sortServices((cat.services ?? []) as ApiService[]),
              rmap((s: ApiService): TItem => ({ id: s.id, label: s.label }))
            ),
          })
        )
      ),
    []
  );

  const filterServicesByText = useCallback(
    (categories: TCategory[], text: string): TCategory[] => {
      const q = text.trim().toLowerCase();
      if (!q) return categories;
      return pipe(
        categories,
        rmap(
          (cat: TCategory): TCategory => ({
            ...cat,
            items: (cat.items || []).filter((i) =>
              i.label.toLowerCase().includes(q)
            ),
          })
        ),
        rfilter((cat: TCategory) => cat.items.length > 0)
      );
    },
    []
  );

  // Type predicates so we don’t need non-null assertions
  const hasService = useCallback(
    (
      it: IServicesModalProps['initialServiceRequests'][number]
    ): it is { id: string; service: { id: string; label?: string } } =>
      Boolean(it.service?.id),
    []
  );

  const hasOther = useCallback(
    (
      it: IServicesModalProps['initialServiceRequests'][number]
    ): it is { id: string; serviceOther: string } => Boolean(it.serviceOther),
    []
  );

  const computeInitial = useCallback(() => {
    const existing: SelectedService[] = pipe(
      initialServiceRequests,
      rfilter(hasService),
      rmap((it) => ({
        serviceRequestId: it.id,
        serviceId: it.service.id,
        label: it.service.label ?? '',
        markedForDeletion: false,
      }))
    );

    const others = pipe(
      initialServiceRequests,
      rfilter(hasOther),
      rmap((it) => ({
        serviceRequestId: it.id,
        serviceOther: it.serviceOther,
        markedForDeletion: false,
      }))
    );

    return { existing, others };
  }, [initialServiceRequests, hasOther, hasService]);

  // Centralized toggle logic for “standard” services (uses only native array ops)
  const toggleService = useCallback((serviceId: string, label: string) => {
    setServiceRequests((prev) => {
      const i = prev.findIndex((s) => s.serviceId === serviceId);
      if (i === -1) {
        // add new
        return [...prev, { serviceId, label }];
      }

      const cur = prev[i];

      if (!cur.serviceRequestId) {
        // brand-new (not persisted): uncheck = remove
        return prev.filter((s) => s.serviceId !== serviceId);
      }

      // persisted: flip deletion flag
      const next = prev.slice();
      next[i] = { ...cur, markedForDeletion: !cur.markedForDeletion };
      return next;
    });
  }, []);

  // ---------- Derived data ----------
  const categories = useMemo(
    () =>
      toServicesByCategory(
        (availableCategories?.serviceCategories?.results ?? []) as ApiCategory[]
      ),
    [availableCategories, toServicesByCategory]
  );

  const filteredServices = useMemo(
    () => filterServicesByText(categories, searchText),
    [categories, filterServicesByText, searchText]
  );

  const hasResults = filteredServices.some((c) => c.items.length > 0);

  // ---------- Submit ----------
  const submitServices = useCallback(async () => {
    setIsSubmitLoading(true);
    try {
      const toCreate = serviceRequests.filter(
        (s) => !s.serviceRequestId && !s.markedForDeletion
      );
      const toDelete = serviceRequests.filter(
        (s) => Boolean(s.serviceRequestId) && Boolean(s.markedForDeletion)
      );
      const toRemoveOtherServices = serviceRequestsOthers.filter(
        (o) => Boolean(o.serviceRequestId) && Boolean(o.markedForDeletion)
      );
      const toCreateOtherServices = serviceRequestsOthers.filter(
        (o) =>
          Boolean(o.serviceOther) && !o.serviceRequestId && !o.markedForDeletion
      );

      // Sequential awaits (safer with server constraints)
      for (const s of toCreate) {
        await createServiceRequest({
          variables: {
            data: {
              serviceId: s.serviceId,
              noteId,
              serviceRequestType: type,
            },
          },
        });
      }

      for (const s of [...toDelete, ...toRemoveOtherServices]) {
        const id = s.serviceRequestId;
        if (!id) continue; // guard instead of non-null assertion
        await deleteService({ variables: { data: { id } } });
      }

      for (const o of toCreateOtherServices) {
        await createServiceRequest({
          variables: {
            data: {
              serviceOther: o.serviceOther,
              noteId,
              serviceRequestType: type,
            },
          },
        });
      }

      refetch();
      close();
    } catch (e) {
      console.error('Error during service submission:', e);
      showSnackbar({
        message: 'Sorry, there was an error updating the services.',
        type: 'error',
      });
    } finally {
      setIsSubmitLoading(false);
    }
  }, [
    createServiceRequest,
    deleteService,
    noteId,
    refetch,
    close,
    serviceRequests,
    serviceRequestsOthers,
    type,
    showSnackbar,
  ]);

  // ---------- Close (revert) ----------
  const reset = useCallback(() => {
    const { existing, others } = computeInitial();
    setServiceRequests(existing);
    setServiceRequestsOthers(others);
  }, [computeInitial]);

  // ---------- Bootstrap ----------
  useEffect(() => {
    const { existing, others } = computeInitial();
    setServiceRequests(existing);
    setServiceRequestsOthers(others);
  }, [computeInitial]);

  // ---------- Render ----------
  return (
    <View style={{ flex: 1, backgroundColor: Colors.WHITE }}>
      <MainScrollContainer keyboardAware>
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            gap: Spacings.sm,
          }}
          style={{ paddingHorizontal: Spacings.xs }}
        >
          <TextRegular mb="sm">
            Select the services for your client in this interaction.
          </TextRegular>

          <BasicInput
            value={searchText}
            onDelete={() => setSearchText('')}
            onChangeText={setSearchText}
            placeholder="Search a service"
            icon={<SearchIcon color={Colors.NEUTRAL} />}
          />

          {hasResults ? (
            filteredServices.map((category) =>
              category.items.length > 0 ? (
                <View key={category.title}>
                  <TextBold mb="xs">{category.title}</TextBold>
                  {category.items.map((item, idx) => {
                    const entry = rfind(
                      serviceRequests,
                      (s) => s.serviceId === item.id
                    );
                    const checked =
                      !!entry &&
                      (!entry.serviceRequestId || !entry.markedForDeletion);

                    return (
                      <ServiceCheckbox
                        key={item.id}
                        idx={idx}
                        label={item.label}
                        checked={checked}
                        onToggle={() => toggleService(item.id, item.label)}
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
              setServiceRequests={setServiceRequestsOthers}
              serviceRequests={serviceRequestsOthers}
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
          shadowOffset: { width: 0, height: -5 },
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
            accessibilityHint="resets all checkboxes"
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
            accessibilityHint="closes services modal"
          />
        </View>
      </View>
    </View>
  );
}
