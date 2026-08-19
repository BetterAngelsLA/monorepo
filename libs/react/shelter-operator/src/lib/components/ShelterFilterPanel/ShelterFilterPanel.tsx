import { useQuery } from '@apollo/client/react';
import { useActiveOrg } from '@monorepo/ba-platform';
import { Ordering } from '@monorepo/ba-platform/types';
import {
  FilterChip,
  FilterSection,
  useAppDrawer,
} from '@monorepo/react/components';
import { ShelterServiceCategoriesDocument } from '@monorepo/react/shelter';
import { useAtom } from 'jotai';
import { Filter, Search } from 'lucide-react';
import { useState } from 'react';
import {
  nullOperatorShelterFilters,
  operatorShelterFiltersAtom,
  TOperatorShelterFilters,
} from '../../atoms/shelterFiltersAtom';
import {
  DEFAULT_SHELTER_SORT,
  operatorShelterSortAtom,
} from '../../atoms/shelterSortAtom';
import { useShelterCities } from '../../hooks/useShelterCities/useShelterCities';
import { useShelterSpas } from '../../hooks/useShelterSpas/useShelterSpas';
import { Button } from '../base-ui/buttons';
import { Dropdown } from '../base-ui/dropdown/Dropdown';
import type { DropdownOption } from '../base-ui/dropdown/types';
import { filterGroups } from './filterConfig';

const SORT_OPTIONS: DropdownOption<string>[] = [
  { label: 'Name: Ascending', value: 'name-asc' },
  { label: 'Name: Descending', value: 'name-desc' },
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

  const { activeOrg, organizations } = useActiveOrg();
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

  function toggleValue(group: keyof TOperatorShelterFilters, value: string) {
    setFilters((prev) => {
      const current = (prev[group] as string[]) ?? [];
      const next = current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value];
      return { ...prev, [group]: next };
    });
  }

  function clearGroup(group: keyof TOperatorShelterFilters) {
    setFilters((prev) => ({ ...prev, [group]: [] }));
  }

  function setMaxStay(value: string) {
    setFilters((prev) => ({ ...prev, maxStayDays: value }));
  }

  const normalizedSearch = searchTerm.toLowerCase().trim();
  const hasActiveFilters = Object.values(filters).some(hasActiveFilter);

  function clearAllFilters() {
    setFilters(nullOperatorShelterFilters);
  }

  function sectionVisible(
    header: string,
    options: { id: string; label: string }[],
  ) {
    if (!normalizedSearch) return options.length > 0;
    return (
      header.toLowerCase().includes(normalizedSearch) ||
      options.some((o) => o.label.toLowerCase().includes(normalizedSearch))
    );
  }

  function filterOptions(
    header: string,
    options: { id: string; label: string }[],
  ): { id: string; label: string }[] {
    if (!normalizedSearch) return options;
    if (header.toLowerCase().includes(normalizedSearch)) return options;
    return options.filter((o) =>
      o.label.toLowerCase().includes(normalizedSearch),
    );
  }

  // Build organization options from the active org's sibling orgs
  const orgOptions = organizations
    .filter((org) => org.id !== undefined)
    .map((org) => ({ id: String(org.id), label: org.name ?? String(org.id) }));

  const spaOptions = spas.map((s) => ({ id: s.id, label: s.name }));
  const cityOptions = cities.map((c) => ({ id: c.id, label: c.name }));

  return (
    <div className="flex flex-col gap-3">
      {/* ── Sort ── */}
      <div className="flex flex-col gap-2 mb-2">
        <span className="text-sm font-semibold text-gray-700">Sort</span>
        <Dropdown
          options={SORT_OPTIONS}
          value={sortValue}
          onChange={handleSortChange}
          placeholder="Select sort order"
        />
      </div>

      {/* ── Filter header + clear all ── */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-gray-700">Filter</span>
        {hasActiveFilters && (
          <button
            type="button"
            onClick={clearAllFilters}
            className="inline-flex items-center gap-0.5 text-[12px] text-neutral-warm-70 cursor-pointer"
          >
            Clear all
          </button>
        )}
      </div>

      {/* ── Search filters ── */}
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

      {/* ── Static enum chip groups ── */}
      {filterGroups.map((group) => {
        const headerMatches =
          normalizedSearch &&
          group.header.toLowerCase().includes(normalizedSearch);
        const visibleOpts = normalizedSearch
          ? headerMatches
            ? group.options
            : group.options.filter((opt) =>
                opt.label.toLowerCase().includes(normalizedSearch),
              )
          : group.options;
        if (normalizedSearch && visibleOpts.length === 0) return null;
        const groupValues =
          (filters[group.name as keyof TOperatorShelterFilters] as string[]) ??
          [];
        return (
          <FilterSection
            key={group.name}
            header={group.header}
            onClear={
              groupValues.length > 0
                ? () => clearGroup(group.name as keyof TOperatorShelterFilters)
                : undefined
            }
          >
            {visibleOpts.map((opt) => (
              <FilterChip
                key={opt.value}
                label={opt.label}
                active={groupValues.includes(opt.value)}
                activeClassName={group.activeClassName}
                onClick={() =>
                  toggleValue(
                    group.name as keyof TOperatorShelterFilters,
                    opt.value,
                  )
                }
              />
            ))}
          </FilterSection>
        );
      })}

      {/* ── Organizations ── */}
      {sectionVisible('Organization', orgOptions) && orgOptions.length > 1 && (
        <FilterSection
          header="Organization"
          onClear={
            filters.organizations.length > 0
              ? () => clearGroup('organizations')
              : undefined
          }
        >
          {filterOptions('Organization', orgOptions).map((org) => (
            <FilterChip
              key={org.id}
              label={org.label}
              active={filters.organizations.includes(org.id)}
              activeClassName="bg-tags-main text-black"
              onClick={() => toggleValue('organizations', org.id)}
            />
          ))}
        </FilterSection>
      )}

      {/* ── SPA ── */}
      {sectionVisible('SPA', spaOptions) && spaOptions.length > 0 && (
        <FilterSection
          header="SPA"
          onClear={
            filters.spa.length > 0 ? () => clearGroup('spa') : undefined
          }
        >
          {filterOptions('SPA', spaOptions).map((spa) => (
            <FilterChip
              key={spa.id}
              label={spa.label}
              active={filters.spa.includes(spa.id)}
              activeClassName="bg-tags-yellow text-black"
              onClick={() => toggleValue('spa', spa.id)}
            />
          ))}
        </FilterSection>
      )}

      {/* ── SPAs Served ── */}
      {sectionVisible('SPAs Served', spaOptions) && spaOptions.length > 0 && (
        <FilterSection
          header="SPAs Served"
          onClear={
            filters.spasServed.length > 0
              ? () => clearGroup('spasServed')
              : undefined
          }
        >
          {filterOptions('SPAs Served', spaOptions).map((spa) => (
            <FilterChip
              key={spa.id}
              label={spa.label}
              active={filters.spasServed.includes(spa.id)}
              activeClassName="bg-tags-yellow text-black"
              onClick={() => toggleValue('spasServed', spa.id)}
            />
          ))}
        </FilterSection>
      )}

      {/* ── City ── */}
      {(!normalizedSearch ||
        'city'.includes(normalizedSearch)) &&
        cityOptions.length > 0 && (
          <FilterSection
            header="City"
            onClear={
              filters.city.length > 0 ? () => clearGroup('city') : undefined
            }
          >
            <Dropdown
              isMulti
              isSearchable
              placeholder="Select cities…"
              options={cityOptions.map((c) => ({
                label: c.label,
                value: c.id,
              }))}
              value={
                filters.city.length > 0
                  ? (cityOptions
                      .filter((c) => filters.city.includes(c.id))
                      .map((c) => ({
                        label: c.label,
                        value: c.id,
                      })) as DropdownOption<string>[])
                  : null
              }
              onChange={(selected) => {
                setFilters((prev) => ({
                  ...prev,
                  city: selected ? selected.map((o) => o.value) : [],
                }));
              }}
            />
          </FilterSection>
        )}

      {/* ── Cities Served ── */}
      {(!normalizedSearch ||
        'cities served'.includes(normalizedSearch)) &&
        cityOptions.length > 0 && (
          <FilterSection
            header="Cities Served"
            onClear={
              filters.citiesServed.length > 0
                ? () => clearGroup('citiesServed')
                : undefined
            }
          >
            <Dropdown
              isMulti
              isSearchable
              placeholder="Select cities…"
              options={cityOptions.map((c) => ({
                label: c.label,
                value: c.id,
              }))}
              value={
                filters.citiesServed.length > 0
                  ? (cityOptions
                      .filter((c) => filters.citiesServed.includes(c.id))
                      .map((c) => ({
                        label: c.label,
                        value: c.id,
                      })) as DropdownOption<string>[])
                  : null
              }
              onChange={(selected) => {
                setFilters((prev) => ({
                  ...prev,
                  citiesServed: selected ? selected.map((o) => o.value) : [],
                }));
              }}
            />
          </FilterSection>
        )}

      {/* ── Services (grouped by category) ── */}
      {serviceCategories.map((category) => {
        const categoryServiceOptions = (category.services ?? []).map((s) => ({
          id: s.id,
          label: s.displayName,
        }));
        if (!sectionVisible(category.displayName, categoryServiceOptions))
          return null;
        const visible = filterOptions(category.displayName, categoryServiceOptions);
        if (visible.length === 0) return null;
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
                onClick={() => toggleValue('services', svc.id)}
              />
            ))}
          </FilterSection>
        );
      })}

      {/* ── Max Stay (days) ── */}
      {(!normalizedSearch ||
        'max stay'.includes(normalizedSearch) ||
        'days'.includes(normalizedSearch)) && (
        <FilterSection
          header="Max Stay (days)"
          onClear={
            filters.maxStayDays !== ''
              ? () => setMaxStay('')
              : undefined
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

      {/* ── On-Site Security ── */}
      {(!normalizedSearch ||
        'on-site security'.includes(normalizedSearch) ||
        'security'.includes(normalizedSearch)) && (
        <FilterSection
          header="On-Site Security"
          onClear={
            filters.onSiteSecurity.length > 0
              ? () => clearGroup('onSiteSecurity')
              : undefined
          }
        >
          <FilterChip
            label="Yes"
            active={filters.onSiteSecurity.includes('true')}
            activeClassName="bg-tags-main text-black"
            onClick={() => toggleValue('onSiteSecurity', 'true')}
          />
          <FilterChip
            label="No"
            active={filters.onSiteSecurity.includes('false')}
            activeClassName="bg-tags-main text-black"
            onClick={() => toggleValue('onSiteSecurity', 'false')}
          />
        </FilterSection>
      )}

      {/* ── Private Shelter ── */}
      {(!normalizedSearch ||
        'private'.includes(normalizedSearch) ||
        'private shelter'.includes(normalizedSearch)) && (
        <FilterSection
          header="Private Shelter"
          onClear={
            filters.isPrivate.length > 0
              ? () => clearGroup('isPrivate')
              : undefined
          }
        >
          <FilterChip
            label="Yes"
            active={filters.isPrivate.includes('true')}
            activeClassName="bg-tags-pink text-black"
            onClick={() => toggleValue('isPrivate', 'true')}
          />
          <FilterChip
            label="No"
            active={filters.isPrivate.includes('false')}
            activeClassName="bg-tags-pink text-black"
            onClick={() => toggleValue('isPrivate', 'false')}
          />
        </FilterSection>
      )}
    </div>
  );
}

export function ShelterFilterPanel() {
  const { showDrawer } = useAppDrawer();

  function openDrawer() {
    showDrawer({
      placement: 'right',
      header: 'Sort & Filter',
      content: <SortFilterDrawerContent />,
    });
  }

  return (
    <Button
      variant="primary"
      leftIcon={<Filter size={20} />}
      rightIcon={false}
      onClick={openDrawer}
    >
      Sort & Filter
    </Button>
  );
}
