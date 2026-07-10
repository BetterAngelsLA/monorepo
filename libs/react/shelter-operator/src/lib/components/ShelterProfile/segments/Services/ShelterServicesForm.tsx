import { useQuery } from '@apollo/client/react';
import { zodResolver } from '@hookform/resolvers/zod';
import { mergeCss } from '@monorepo/react/shared';
import { ShelterServiceCategoriesDocument } from '@monorepo/react/shelter';
import { useCallback, useMemo, useState } from 'react';
import type { UseFormSetError } from 'react-hook-form';
import { Controller, type FieldPathValue, useForm } from 'react-hook-form';
import { type DropdownOption } from '../../../base-ui/dropdown';
import { Form } from '../../../form/Form';
import ServiceCategoryRow from './ServiceCategoryRow';
import { defaultFormValues, formSchema, ServicesFormData } from './formSchema';

type TProps = {
  values?: Partial<ServicesFormData>;
  onSubmit: (
    data: ServicesFormData,
    setError: UseFormSetError<ServicesFormData>
  ) => void;
  isViewMode?: boolean;
  onEditClick?: () => void;
  onCancel?: () => void;
  disabled?: boolean;
  className?: string;
};

export function ShelterServicesForm(props: TProps) {
  const {
    values,
    onSubmit,
    isViewMode = false,
    onEditClick,
    onCancel,
    disabled = false,
    className,
  } = props;

  const { data: queryData } = useQuery(ShelterServiceCategoriesDocument);

  const serviceCategories = queryData?.shelterServiceCategories?.results ?? [];
  const [createdOtherOptionsByCategory, setCreatedOtherOptionsByCategory] =
    useState<Record<string, DropdownOption<string>[]>>({});

  const initialValues = useMemo(
    () => ({ ...defaultFormValues, ...values }),
    [values]
  );

  const { control, handleSubmit, setError, reset } = useForm<ServicesFormData>({
    resolver: zodResolver(formSchema),
    values: initialValues,
    mode: 'onBlur',
  });

  function handleCancel() {
    reset(initialValues);
    onCancel?.();
  }

  const setCreatedOtherOptionsForCategory = useCallback(
    (categoryId: string, nextOptions: DropdownOption<string>[]) => {
      setCreatedOtherOptionsByCategory((prev) => ({
        ...prev,
        [categoryId]: nextOptions,
      }));
    },
    []
  );

  return (
    <div className={mergeCss(['px-6 flex-col flex-1 pb-48', className])}>
      <Form className="flex-1">
        <Form.Header
          title="Shelter Services"
          onEditClick={isViewMode ? onEditClick : undefined}
          className="pl-5"
        />

        <Form.Content className="mt-8">
          <Controller
            name="services"
            control={control}
            render={({ field }) => (
              <>
                {serviceCategories.map((category) => {
                  return (
                    <ServiceCategoryRow
                      key={category.id}
                      category={category}
                      selectedServiceIds={field.value}
                      onSelectedServiceIdsChange={(nextServiceIds) => {
                        field.onChange(
                          nextServiceIds as FieldPathValue<
                            ServicesFormData,
                            'services'
                          >
                        );
                      }}
                      createdOtherOptions={
                        createdOtherOptionsByCategory[category.id] ?? []
                      }
                      setCreatedOtherOptions={(nextOptions) => {
                        setCreatedOtherOptionsForCategory(
                          category.id,
                          nextOptions
                        );
                      }}
                      isViewMode={isViewMode}
                      disabled={disabled}
                    />
                  );
                })}
              </>
            )}
          />

          {!isViewMode && (
            <Form.Actions
              onPrimaryClick={handleSubmit((data) => onSubmit(data, setError))}
              onSecondaryClick={handleCancel}
              primaryDisabled={disabled}
              secondaryDisabled={disabled}
            />
          )}
        </Form.Content>
      </Form>
    </div>
  );
}
