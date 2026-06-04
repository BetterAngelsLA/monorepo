import { memo, useCallback, useMemo } from 'react';
import { Dropdown, type DropdownOption } from '../../../base-ui/dropdown';
import { Form } from '../../../form/Form';
import { SEARCHABLE_DROPDOWN_MIN } from '../../constants';

export type ServiceCategory = {
  id: string;
  displayName: string;
  services: Array<{
    id: string;
    displayName: string;
    isOther: boolean;
  }>;
};

type ServiceCategoryRowProps = {
  category: ServiceCategory;
  selectedServiceIds: string[];
  onSelectedServiceIdsChange: (nextServiceIds: string[]) => void;
  createdOtherOptions: DropdownOption<string>[];
  setCreatedOtherOptions: (nextOptions: DropdownOption<string>[]) => void;
  isViewMode: boolean;
  disabled: boolean;
};

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

const normalize = (value: string) => value.trim().toLowerCase();

const createCustomServiceId = (categoryId: string, label: string) => {
  const slug = normalize(label)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  return `custom:${categoryId}:${slug}`;
};

const ServiceCategoryRow = memo(function ServiceCategoryRow({
  category,
  selectedServiceIds,
  onSelectedServiceIdsChange,
  createdOtherOptions,
  setCreatedOtherOptions,
  isViewMode,
  disabled,
}: ServiceCategoryRowProps) {
  const {
    options,
    otherOptions,
    officialServiceIds,
    otherServiceIds,
    selectedOptions,
    selectedOtherOptions,
    selectedOtherByCategory,
  } = useMemo(() => {
    const officialServices = category.services.filter(
      (service) => !service.isOther
    );

    const otherServices = category.services.filter(
      (service) => service.isOther
    );

    const nextOptions: DropdownOption<string>[] = officialServices.map(
      (service) => ({
        value: service.id,
        label: service.displayName,
      })
    );

    const otherOptionsFromApi: DropdownOption<string>[] = otherServices.map(
      (service) => ({
        value: service.id,
        label: service.displayName,
      })
    );

    const nextOtherOptions: DropdownOption<string>[] = [
      ...otherOptionsFromApi,
      ...createdOtherOptions,
    ];

    const nextOfficialServiceIds = officialServices.map(
      (service) => service.id
    );
    const nextOtherServiceIds = nextOtherOptions.map((option) => option.value);

    const selectedByCategory = selectedServiceIds.filter((serviceId) =>
      nextOfficialServiceIds.includes(serviceId)
    );

    const nextSelectedOtherByCategory = selectedServiceIds.filter((serviceId) =>
      nextOtherServiceIds.includes(serviceId)
    );

    return {
      options: nextOptions,
      otherOptions: nextOtherOptions,
      officialServiceIds: nextOfficialServiceIds,
      otherServiceIds: nextOtherServiceIds,
      selectedOptions: nextOptions.filter((option) =>
        selectedByCategory.includes(option.value)
      ),
      selectedOtherOptions: nextOtherOptions.filter((option) =>
        nextSelectedOtherByCategory.includes(option.value)
      ),
      selectedOtherByCategory: nextSelectedOtherByCategory,
    };
  }, [category, createdOtherOptions, selectedServiceIds]);

  const handleOfficialChange = useCallback(
    (nextOptions: DropdownOption<string>[] | null) => {
      const nextSubsetIds = nextOptions
        ? nextOptions.map((option) => option.value)
        : [];

      onSelectedServiceIdsChange(
        replaceCategoryServiceSelection(
          selectedServiceIds,
          officialServiceIds,
          nextSubsetIds
        )
      );
    },
    [onSelectedServiceIdsChange, selectedServiceIds, officialServiceIds]
  );

  const handleOtherChange = useCallback(
    (nextOptions: DropdownOption<string>[] | null) => {
      const nextSubsetIds = nextOptions
        ? nextOptions.map((option) => option.value)
        : [];

      onSelectedServiceIdsChange(
        replaceCategoryServiceSelection(
          selectedServiceIds,
          otherServiceIds,
          nextSubsetIds
        )
      );
    },
    [onSelectedServiceIdsChange, selectedServiceIds, otherServiceIds]
  );

  const handleCreateOtherOption = useCallback(
    (label: string) => {
      const trimmedLabel = label.trim();
      if (!trimmedLabel) {
        return;
      }

      const normalizedLabel = normalize(trimmedLabel);
      const alreadyExists = otherOptions.some(
        (option) => normalize(option.label) === normalizedLabel
      );

      if (alreadyExists) {
        return;
      }

      const createdOption: DropdownOption<string> = {
        value: createCustomServiceId(category.id, trimmedLabel),
        label: trimmedLabel,
      };

      setCreatedOtherOptions([...createdOtherOptions, createdOption]);

      onSelectedServiceIdsChange(
        replaceCategoryServiceSelection(selectedServiceIds, otherServiceIds, [
          ...selectedOtherByCategory,
          createdOption.value,
        ])
      );
    },
    [
      category.id,
      createdOtherOptions,
      onSelectedServiceIdsChange,
      otherOptions,
      otherServiceIds,
      selectedOtherByCategory,
      selectedServiceIds,
      setCreatedOtherOptions,
    ]
  );

  return (
    <Form.Block columns={2}>
      <Dropdown
        label={category.displayName}
        isMulti={true}
        isSearchable={options.length > SEARCHABLE_DROPDOWN_MIN}
        value={selectedOptions}
        options={options}
        onChange={handleOfficialChange}
        isViewMode={isViewMode}
      />

      <Dropdown
        label={`${category.displayName} (Other)`}
        isMulti={true}
        isSearchable={true}
        value={selectedOtherOptions}
        options={otherOptions}
        onChange={handleOtherChange}
        isViewMode={isViewMode}
        disabled={disabled}
        placeholder={
          otherOptions.length > 0 ? 'Please select' : 'No custom services'
        }
        onCreateOption={handleCreateOtherOption}
      />
    </Form.Block>
  );
});

export default ServiceCategoryRow;
