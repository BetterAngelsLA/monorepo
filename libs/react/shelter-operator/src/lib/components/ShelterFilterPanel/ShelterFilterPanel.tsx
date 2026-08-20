import { useQuery } from '@apollo/client/react';
import { Ordering } from '@monorepo/ba-platform/types';
import {
  FilterChip,
  FilterSection,
  useAppDrawer,
} from '@monorepo/react/components';
import { ShelterServiceCategoriesDocument } from '@monorepo/react/shelter';
import { useAtom, useAtomValue } from 'jotai';
import { Filter, Search } from 'lucide-react';
import { useState } from 'react';
import {
  nullOperatorShelterFilters,
  operatorShelterFiltersAtom,
} from '../../atoms/shelterFiltersAtom';
import {
  DEFAULT_SHELTER_SORT,
  operatorShelterSortAtom,
} from '../../atoms/shelterSortAtom';
import {
  useShelterCities,
  useShelterOperatorOrganizations,
  useShelterSpas,
} from '../../hooks';
import { Button } from '../base-ui/buttons';
import { Dropdown } from '../base-ui/dropdown/Dropdown';
import type { DropdownOption } from '../base-ui/dropdown/types';
import { BooleanFilterSection } from './BooleanFilterSection';
import { ChipFilterSection } from './ChipFilterSection';
import { filterGroups } from './filterConfig';
import { getVisibleOptions, headerMatches } from './filterSearch';
import { MultiSelectFilterSection } from './MultiSelectFilterSection';

const SORT_OPTIONS: DropdownOption<string>[] = [
  { label: 'Name: Ascending', value: 'name-asc' },
  { label: 'Name: Descending', value: 'name-desc' },
  { label: 'Status: Ascending', value: 'status-asc' },
  { label: 'Status: Descending', value: 'status-desc' },
  { label: 'Organization: A to Z', value: 'organization-asc' },
  { label: 'Organization: Z to A', value: 'organization-desc' },
  { label: 'Capacity: Low to High', value: 'capacity-asc' },
  { label: 'Capacity: High to Low', value: 'capacity-desc' },
];

function hasActiveFilter(value: string[] | string): boolean {
  return Array.isArray(value) ? value.length > 0 : value !== '';
}

function SortFilterDrawerContent() {
  const [sort, setSort] = useAtom(operatorShelterSortAtom);
  const [filters, setFilters] = useAtom(operatorShelterFiltersAtom);
  const [searchTerm, setSearchTerm] = useState('');

  // Subscribe here so the drawer updates when prefetch resolves (or cache updates).
  const { organizations: shelterOperatorOrgs } =
    useShelterOperatorOrganizations();
  const { cities } = useShelterCities();
  const { spas } = useShelterSpas();
  const { data: serviceCategoriesData } = useQuery(
    ShelterServiceCategoriesDocument,
  );
  const serviceCategories =
    serviceCategoriesData?.shelterServiceCategories?.results ?? [];

  const sortValue =
    SORT_OPTIONS.find(
      (o) =>
        o.value ===
        `${sort.column}-${sort.direction === Ordering.Asc ? 'asc' : 'desc'}`,
    ) ?? null;

  function handleSortChange(opt: DropdownOption<string> | null) {
    if (!opt) {
      setSort(DEFAULT_SHELTER_SORT);
      return;
    }
    const [column, dir] = opt.value.split('-');
    setSort({
      column: column as typeof sort.column,
      direction: dir === 'asc' ? Ordering.Asc : Ordering.Desc,
    });
  }

  function setMaxStay(value: string) {
    if (value === '') {
      setFilters((prev) => ({ ...prev, maxStayDays: '' }));
      return;
    }
    const days = Number(value);
    if (!Number.isFinite(days) || days < 1) {
      return;
    }
    setFilters((prev) => ({ ...prev, maxStayDays: value }));
  }

  const normalizedSearch = searchTerm.toLowerCase().trim();
  const hasActiveFilters = Object.values(filters).some(hasActiveFilter);

  const orgOptions = shelterOperatorOrgs.map((org) => ({
    id: String(org.id),
    label: org.name,
  }));
  const spaOptions = spas.map((s) => ({ id: s.id, label: s.name }));
  const cityOptions = cities.map((c) => ({ id: c.id, label: c.name }));

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-2 mb-2">
        <span className="text-sm font-semibold text-gray-700">Sort</span>
        <Dropdown
          options={SORT_OPTIONS}
          value={sortValue}
          onChange={handleSortChange}
          placeholder="Select sort order"
        />
      </div>

      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-gray-700">Filter</span>
        {hasActiveFilters && (
          <button
            type="button"
            onClick={() => setFilters(nullOperatorShelterFilters)}
            className="inline-flex items-center gap-0.5 text-[12px] text-neutral-warm-70 cursor-pointer"
          >
            Clear all
          </button>
        )}
      </div>

      <div className="relative mb-1">
        <Search
          size={14}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-warm-70"
        />
        <input
          type="text"
          placeholder="Search filters"
          className="w-full pl-8 pr-3 py-1.5 rounded-full border border-neutral-90 text-xs outline-none text-neutral-warm-70"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {filterGroups.map((group) => (
        <ChipFilterSection
          key={group.name}
          header={group.header}
          filterKey={group.name}
          options={group.options.map((o) => ({ id: o.value, label: o.label }))}
          activeClassName={group.activeClassName}
          search={normalizedSearch}
        />
      ))}

      <MultiSelectFilterSection
        header="Organization"
        filterKey="organizations"
        options={orgOptions}
        placeholder="Select organizations…"
        search={normalizedSearch}
        searchTerms={['organization']}
        minOptions={2}
      />

      <ChipFilterSection
        header="SPA"
        filterKey="spa"
        options={spaOptions}
        activeClassName="bg-tags-yellow text-black"
        search={normalizedSearch}
      />

      <ChipFilterSection
        header="SPAs Served"
        filterKey="spasServed"
        options={spaOptions}
        activeClassName="bg-tags-yellow text-black"
        search={normalizedSearch}
      />

      <MultiSelectFilterSection
        header="City"
        filterKey="city"
        options={cityOptions}
        placeholder="Select cities…"
        search={normalizedSearch}
        searchTerms={['city']}
      />

      <MultiSelectFilterSection
        header="Cities Served"
        filterKey="citiesServed"
        options={cityOptions}
        placeholder="Select cities…"
        search={normalizedSearch}
        searchTerms={['cities served']}
      />

      {serviceCategories.map((category) => {
        const categoryServiceOptions = (category.services ?? []).map((s) => ({
          id: s.id,
          label: s.displayName,
        }));
        const visible = getVisibleOptions(
          category.displayName,
          categoryServiceOptions,
          normalizedSearch,
        );
        if (!visible) return null;
        const categoryIds = categoryServiceOptions.map((s) => s.id);
        return (
          <FilterSection
            key={category.id}
            header={category.displayName}
            onClear={
              filters.services.some((id) => categoryIds.includes(id))
                ? () =>
                    setFilters((prev) => ({
                      ...prev,
                      services: prev.services.filter(
                        (id) => !categoryIds.includes(id),
                      ),
                    }))
                : undefined
            }
          >
            {visible.map((svc) => (
              <FilterChip
                key={svc.id}
                label={svc.label}
                active={filters.services.includes(svc.id)}
                activeClassName="bg-tags-purple text-black"
                onClick={() =>
                  setFilters((prev) => {
                    const current = prev.services;
                    const next = current.includes(svc.id)
                      ? current.filter((v) => v !== svc.id)
                      : [...current, svc.id];
                    return { ...prev, services: next };
                  })
                }
              />
            ))}
          </FilterSection>
        );
      })}

      {headerMatches('Max Stay (days)', normalizedSearch, [
        'max stay',
        'days',
      ]) && (
        <FilterSection
          header="Max Stay (days)"
          onClear={
            filters.maxStayDays !== '' ? () => setMaxStay('') : undefined
          }
        >
          <input
            type="number"
            min={1}
            value={filters.maxStayDays}
            onChange={(e) => setMaxStay(e.target.value)}
            placeholder="e.g. 90"
            className="w-full rounded-lg border border-[#D3D9E3] px-3 py-1.5 text-sm outline-none"
          />
        </FilterSection>
      )}

      <BooleanFilterSection
        header="On-Site Security"
        filterKey="onSiteSecurity"
        activeClassName="bg-tags-main text-black"
        search={normalizedSearch}
        searchTerms={['on-site security', 'security']}
      />

      <BooleanFilterSection
        header="Private Shelter"
        filterKey="isPrivate"
        activeClassName="bg-tags-pink text-black"
        search={normalizedSearch}
        searchTerms={['private', 'private shelter']}
      />
    </div>
  );
}

export function ShelterFilterPanel() {
  const { showDrawer } = useAppDrawer();
  const filters = useAtomValue(operatorShelterFiltersAtom);
  const activeFilterCount = Object.values(filters).reduce(
    (count, value) => count + (hasActiveFilter(value) ? 1 : 0),
    0,
  );

  // Warm Apollo cache on page load so the drawer rarely shows empty dropdowns.
  useShelterOperatorOrganizations();
  useShelterCities();
  useShelterSpas();
  useQuery(ShelterServiceCategoriesDocument);

  function openDrawer() {
    showDrawer({
      placement: 'right',
      header: 'Sort & Filter',
      content: <SortFilterDrawerContent />,
    });
  }

  return (
    <div className="relative w-fit">
      <Button
        variant="primary"
        leftIcon={<Filter size={20} />}
        rightIcon={false}
        onClick={openDrawer}
      >
        Sort & Filter
      </Button>
      {activeFilterCount > 0 && (
        <span className="absolute -top-1.5 -right-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#008CEE] px-1 text-[11px] font-semibold text-white">
          {activeFilterCount}
        </span>
      )}
    </div>
  );
}
