import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { pipe, filter as rfilter, find as rfind, map as rmap } from 'remeda';

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

import { ServiceRequestTypeEnum } from '../../apollo';
import { useSnackbar } from '../../hooks';

import MainScrollContainer from '../MainScrollContainer';
import OtherCategory from './OtherCategory';
import ServiceCheckbox from './ServiceCheckbox';

import { useQuery } from '@apollo/client/react';
import {
  HmisServiceCategoriesDocument,
  HmisServiceCategoriesQuery,
} from './__generated__/HmisServices.generated';

type SelectedService = {
  id?: string;
  service?: { id: string; label?: string } | null;
  serviceOther?: string | null;
  markedForDeletion?: boolean;
};

type ServiceBucket = {
  serviceRequests: SelectedService[];
};

type SelectPatch = Partial<Record<ServiceRequestTypeEnum, ServiceBucket>>;

type ApiCategory =
  HmisServiceCategoriesQuery['serviceCategories']['results'][number];

type ApiService = NonNullable<ApiCategory['services']>[number];

type TItem = { id: string; label: string };
type TCategory = { title: string; items: TItem[] };

interface IServicesModalProps {
  selectedServices: SelectedService[];
  type: ServiceRequestTypeEnum.Provided | ServiceRequestTypeEnum.Requested;
  onSelect: (patch: SelectPatch) => void;
  close: () => void;
}

export default function ServicesModal(props: IServicesModalProps) {
  const { selectedServices, type, onSelect, close } = props;

  const { data: availableCategories } = useQuery(HmisServiceCategoriesDocument);
  const { showSnackbar } = useSnackbar();
  const { top: topInset, bottom: bottomInset } = useSafeAreaInsets();

  const [rows, setRows] = useState<SelectedService[]>([]);

  const [searchText, setSearchText] = useState('');

  const tmpIdRef = useRef(0);
  const makeTmpId = useCallback(() => `tmp-other-${tmpIdRef.current++}`, []);

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

  const hasService = useCallback(
    (
      it: SelectedService
    ): it is SelectedService & { service: { id: string; label?: string } } =>
      !!it.service?.id,
    []
  );

  const hasOther = useCallback(
    (it: SelectedService): it is SelectedService & { serviceOther: string } =>
      typeof it.serviceOther === 'string' && it.serviceOther.length > 0,
    []
  );

  const computeInitial = useCallback(() => {
    const std = pipe(
      selectedServices,
      rfilter(hasService),
      rfilter((it) => !it.serviceOther || it.serviceOther.trim().length === 0),
      rmap((it) => ({
        id: it.id,
        service: { id: it.service!.id, label: it.service!.label ?? '' },
        markedForDeletion: it.markedForDeletion ?? false,
      }))
    );

    const others = pipe(
      selectedServices,
      rfilter(hasOther),
      rmap((it) => ({
        id: it.id,
        serviceOther: it.serviceOther,
        markedForDeletion: it.markedForDeletion ?? false,
      }))
    );

    return [...std, ...others];
  }, [selectedServices, hasOther, hasService]);

  const toggleService = useCallback((serviceId: string, label: string) => {
    setRows((prev) => {
      const i = prev.findIndex((r) => r.service?.id === serviceId);

      if (i === -1) {
        return [...prev, { service: { id: serviceId, label } }];
      }

      const cur = prev[i];

      if (!cur.id) {
        return prev.filter((r) => r.service?.id !== serviceId);
      }

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

  const otherCategoryRows = useMemo(
    () =>
      rows
        .filter((r) => r.serviceOther)
        .map((r) => ({
          serviceOther: r.serviceOther!,
          serviceRequestId: r.id,
          markedForDeletion: r.markedForDeletion ?? false,
        })),
    [rows]
  );

  const setOtherCategoryRows = useCallback(
    (
      next: {
        serviceOther: string | null;
        serviceRequestId?: string;
        markedForDeletion?: boolean;
      }[]
    ) => {
      setRows((prev) => {
        const nonOther = prev.filter((r) => !r.serviceOther);

        const merged = next.map((o) => {
          const existing =
            (o.serviceRequestId &&
              prev.find((r) => r.id === o.serviceRequestId)) ||
            prev.find(
              (r) =>
                !!r.serviceOther &&
                r.serviceOther === o.serviceOther &&
                !r.service
            );

          const isServerId =
            !!o.serviceRequestId &&
            !o.serviceRequestId.startsWith('tmp-other-');

          const id = isServerId
            ? o.serviceRequestId!
            : existing?.id ?? makeTmpId();

          return {
            id,
            serviceOther: o.serviceOther,
            markedForDeletion: o.markedForDeletion ?? false,
          } as SelectedService;
        });

        return [...nonOther, ...merged];
      });
    },
    [makeTmpId]
  );

  // ---------- Submit ----------
  const submitServices = useCallback(async () => {
    onSelect({
      [type]: { serviceRequests: rows },
    });

    close();
  }, [rows, type, close, showSnackbar]);

  // ---------- Close (revert) ----------
  const reset = useCallback(() => setRows(computeInitial()), [computeInitial]);

  const closeModal = useCallback(() => {
    reset();
    close();
  }, [reset, close]);

  // ---------- Bootstrap ----------
  useEffect(() => {
    setRows(computeInitial());
  }, [computeInitial]);

  // ---------- Render ----------
  return (
    <View
      style={{ flex: 1, backgroundColor: Colors.WHITE, paddingTop: topInset }}
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
          style={{ paddingHorizontal: Spacings.xs }}
        >
          <View>
            <TextBold size="lg">
              {type === 'PROVIDED' ? 'Provided Services' : 'Requested Services'}
            </TextBold>
            <TextRegular mt="xxs" mb="sm">
              Select the services for your client in this interaction.
            </TextRegular>
          </View>

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
                    const entry = rfind(rows, (r) => r.service?.id === item.id);
                    const checked =
                      !!entry && (!entry.id || !entry.markedForDeletion);
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
              serviceRequests={otherCategoryRows}
              setServiceRequests={setOtherCategoryRows}
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
