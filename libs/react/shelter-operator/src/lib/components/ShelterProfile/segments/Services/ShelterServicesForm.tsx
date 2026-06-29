import { useQuery } from '@apollo/client/react';
import { zodResolver } from '@hookform/resolvers/zod';
import { mergeCss } from '@monorepo/react/shared';
import { ShelterServiceCategoriesDocument } from '@monorepo/react/shelter';
import { useCallback, useState } from 'react';
import { Controller, type FieldPathValue, useForm } from 'react-hook-form';
import { type DropdownOption } from '../../../base-ui/dropdown';
import { Form } from '../../../form/Form';
import ServiceCategoryRow from './ServiceCategoryRow';
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
  const [createdOtherOptionsByCategory, setCreatedOtherOptionsByCategory] =
    useState<Record<string, DropdownOption<string>[]>>({});

  const {
    control,
    handleSubmit,
    formState: { isValid },
    reset,
  } = useForm<ServicesFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: { ...defaultFormValues, ...defaultValues },
    mode: 'onBlur',
  });

  function handleCancel() {
    reset();
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

        <form className="flex flex-col gap-10 mt-8">
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
