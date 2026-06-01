import { useQuery } from '@apollo/client/react';
import { zodResolver } from '@hookform/resolvers/zod';
import { mergeCss } from '@monorepo/react/shared';
import { ShelterServiceCategoriesDocument } from '@monorepo/react/shelter';
import { Controller, type FieldPathValue, useForm } from 'react-hook-form';
import { Dropdown, type DropdownOption } from '../../../base-ui/dropdown';
import { Form } from '../../../form/Form';
import { defaultFormValues, formSchema, ServicesFormData } from './formSchema';

type TProps = {
  defaultValues?: Partial<ServicesFormData>;
  onSubmit?: (data: ServicesFormData) => void;
  isViewMode?: boolean;
  onEditClick?: () => void;
  onCancel?: () => void;
  disabled?: boolean;
  className?: string;
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

export function ShelterServicesForm(props: TProps) {
  const {
    defaultValues,
    onSubmit,
    isViewMode = false,
    onEditClick,
    onCancel,
    disabled = false,
    className,
  } = props;

  const { data: queryData } = useQuery(ShelterServiceCategoriesDocument);

  const serviceCategories = queryData?.shelterServiceCategories?.results ?? [];

  const {
    control,
    handleSubmit,
    formState: { isValid },
    reset,
  } = useForm<ServicesFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: { ...defaultFormValues, ...defaultValues },
  });

  function handleCancel() {
    reset();
    onCancel?.();
  }

  return (
    <div className={mergeCss(['px-6 flex-col flex-1 pb-48', className])}>
      <Form className="flex-1">
        <Form.Header
          title="Shelter Services"
          onEditClick={isViewMode ? onEditClick : undefined}
          className="pl-5"
        />

        <form className="flex flex-col gap-10 mt-8">
          <Controller
            name="services"
            control={control}
            render={({ field }) => (
              <>
                {serviceCategories.map((category) => {
                  const officialServices = category.services.filter(
                    (service) => !service.isOther
                  );

                  const options: DropdownOption<string>[] =
                    officialServices.map((service) => ({
                      value: service.id,
                      label: service.displayName,
                    }));

                  const officialServiceIds = officialServices.map(
                    (service) => service.id
                  );

                  const selectedByCategory = field.value.filter((serviceId) =>
                    officialServiceIds.includes(serviceId)
                  );

                  const selectedOptions = options.filter((option) =>
                    selectedByCategory.includes(option.value)
                  );

                  return (
                    <Form.Block columns={2} key={category.id}>
                      <Dropdown
                        label={category.displayName}
                        isMulti={true}
                        isSearchable={options.length > 3}
                        value={selectedOptions}
                        options={options}
                        onChange={(nextOptions) => {
                          const nextSubsetIds = nextOptions
                            ? nextOptions.map((option) => option.value)
                            : [];

                          field.onChange(
                            replaceCategoryServiceSelection(
                              field.value,
                              officialServiceIds,
                              nextSubsetIds
                            ) as FieldPathValue<ServicesFormData, 'services'>
                          );
                        }}
                        isViewMode={isViewMode}
                        className="min-w-44"
                      />

                      <div />
                    </Form.Block>
                  );
                })}
              </>
            )}
          />

          {!isViewMode && onSubmit && (
            <Form.Actions
              onPrimaryClick={() => handleSubmit(onSubmit)()}
              onSecondaryClick={handleCancel}
              primaryDisabled={disabled || !isValid}
              secondaryDisabled={disabled}
            />
          )}
        </form>
      </Form>
    </div>
  );
}
