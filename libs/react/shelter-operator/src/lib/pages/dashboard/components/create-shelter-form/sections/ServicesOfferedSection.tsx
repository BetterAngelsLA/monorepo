import { useQuery } from '@apollo/client/react';
import {
  ShelterServiceCategoriesDocument,
  type ShelterServiceCategoriesQuery,
} from '@monorepo/react/shelter';
import { memo } from 'react';
import { FormSection } from '../../../../../components/form/FormSection';
import { TextAreaField } from '../../../../../components/form/TextAreaField';
import { ServiceAutocomplete } from '../components/ServiceAutocomplete';
import type { SectionProps } from '../types';

type ServiceCategory =
  ShelterServiceCategoriesQuery['shelterServiceCategories']['results'][number];

const replaceCategoryServiceSelection = (
  selectedServiceIds: string[],
  subsetServiceIds: string[],
  nextSubsetServiceIds: string[]
) => {
  const subsetIds = new Set(subsetServiceIds);
  const nextSelectedIds = selectedServiceIds.filter((id) => !subsetIds.has(id));

  for (const id of nextSubsetServiceIds) {
    if (!nextSelectedIds.includes(id)) {
      nextSelectedIds.push(id);
    }
  }

  return nextSelectedIds;
};

const removePendingDuplicates = (
  pendingValues: string[],
  existingLabels: string[]
) => {
  const existingSet = new Set(
    existingLabels.map((label) => label.trim().toLowerCase())
  );
  return pendingValues.filter(
    (value) => !existingSet.has(value.trim().toLowerCase())
  );
};

export const ServicesOfferedSection = memo(function ServicesOfferedSection({
  data,
  onChange,
}: SectionProps) {
  const {
    data: queryData,
    loading,
    error,
  } = useQuery(ShelterServiceCategoriesDocument);
  const categories = queryData?.shelterServiceCategories?.results ?? [];

  const renderCategory = (category: ServiceCategory) => {
    const officialServices = category.services.filter(
      (service) => !service.isOther
    );
    const otherServices = category.services.filter(
      (service) => service.isOther
    );
    const officialServiceIds = officialServices.map((service) => service.id);
    const otherServiceIds = otherServices.map((service) => service.id);
    const selectedOfficialServiceIds = data.services.filter((serviceId) =>
      officialServiceIds.includes(serviceId)
    );
    const selectedOtherServiceIds = data.services.filter((serviceId) =>
      otherServiceIds.includes(serviceId)
    );
    const pendingServices = data.pendingServicesByCategory[category.id] ?? [];

    return (
      <div
        key={category.id}
        className="space-y-4 border-t border-gray-200 pt-4 first:border-t-0 first:pt-0"
      >
        <h3 className="text-sm font-semibold text-gray-900">
          {category.displayName}
        </h3>

        {officialServices.length > 0 && (
          <ServiceAutocomplete
            label="Official Services"
            placeholder="Search official services..."
            helperText="Select from the existing catalog for this category."
            options={officialServices.map((service) => ({
              value: service.id,
              label: service.displayName,
            }))}
            selectedValues={selectedOfficialServiceIds}
            onSelectedValuesChange={(nextValues) =>
              onChange(
                'services',
                replaceCategoryServiceSelection(
                  data.services,
                  officialServiceIds,
                  nextValues
                )
              )
            }
            emptyMessage="No matching official services"
          />
        )}

        <ServiceAutocomplete
          label="Other Services"
          placeholder="Search or add other services..."
          helperText="Select an existing other service or type a new one and press Enter to add a pending pill."
          options={otherServices.map((service) => ({
            value: service.id,
            label: service.displayName,
          }))}
          selectedValues={selectedOtherServiceIds}
          onSelectedValuesChange={(nextValues) => {
            onChange(
              'services',
              replaceCategoryServiceSelection(
                data.services,
                otherServiceIds,
                nextValues
              )
            );

            const selectedOtherLabels = otherServices
              .filter((service) => nextValues.includes(service.id))
              .map((service) => service.displayName);
            const nextPendingServices = removePendingDuplicates(
              pendingServices,
              selectedOtherLabels
            );

            if (nextPendingServices.length !== pendingServices.length) {
              onChange('pendingServicesByCategory', {
                ...data.pendingServicesByCategory,
                [category.id]: nextPendingServices,
              });
            }
          }}
          pendingValues={pendingServices}
          onPendingValuesChange={(nextValues) =>
            onChange('pendingServicesByCategory', {
              ...data.pendingServicesByCategory,
              [category.id]: nextValues,
            })
          }
          creatable
          emptyMessage="No matching other services. Press Enter to add a new one."
        />
      </div>
    );
  };

  return (
    <FormSection title="Services Offered">
      {loading && (
        <p className="text-sm text-gray-600">Loading service catalog…</p>
      )}

      {!loading && categories.map(renderCategory)}

      {error && (
        <p className="text-sm text-red-700">
          The structured service catalog could not be loaded. You can still
          provide additional notes below.
        </p>
      )}

      <TextAreaField
        id="other-services"
        name="otherServices"
        label="Additional Service Notes"
        helperText="Use this field for service details that do not belong in a category-specific custom service entry."
        value={data.otherServices}
        onChange={(value) => onChange('otherServices', value)}
        rows={3}
      />
    </FormSection>
  );
});
