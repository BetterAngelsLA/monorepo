import { zodResolver } from '@hookform/resolvers/zod';
import { mergeCss } from '@monorepo/react/shared';
import { useMemo } from 'react';
import type { UseFormSetError } from 'react-hook-form';
import { Controller, useForm } from 'react-hook-form';
import { Dropdown } from '../../../base-ui/dropdown';
import { Input } from '../../../base-ui/input';
import { RichTextEditor } from '../../../base-ui/richTextEditor';
import { Form } from '../../../form/Form';
import {
  ENTRY_REQUIREMENT_OPTIONS,
  REFERRAL_REQUIREMENT_OPTIONS,
  VACCINATION_REQUIREMENT_OPTIONS,
} from '../../constants';
import {
  defaultFormValues,
  EntryRequirementsFormData,
  formSchema,
} from './formSchema';

type TProps = {
  values?: Partial<EntryRequirementsFormData>;
  onSubmit: (
    data: EntryRequirementsFormData,
    setError: UseFormSetError<EntryRequirementsFormData>,
  ) => void;
  isViewMode?: boolean;
  onEditClick?: () => void;
  onCancel?: () => void;
  disabled?: boolean;
  className?: string;
};

export function ShelterEntryRequirementsForm(props: TProps) {
  const {
    values,
    onSubmit,
    isViewMode = false,
    onEditClick,
    onCancel,
    disabled = false,
    className,
  } = props;

  const initialValues = useMemo(
    () => ({ ...defaultFormValues, ...values }),
    [values],
  );

  const {
    control,
    handleSubmit,
    formState: { errors },
    setError,
    reset,
  } = useForm<EntryRequirementsFormData>({
    resolver: zodResolver(formSchema),
    values: initialValues,
    mode: 'onBlur',
  });

  function handleCancel() {
    reset(initialValues);
    onCancel?.();
  }

  return (
    <div className={mergeCss(['px-6 flex-col flex-1 pb-48', className])}>
      <Form>
        <Form.Header
          title="Entry Requirements"
          onEditClick={isViewMode ? onEditClick : undefined}
          className="pl-5"
        />

        <Form.Content>
          <Form.Block columns={2}>
            <Controller
              name="entryRequirements"
              control={control}
              render={({ field }) => (
                <Dropdown
                  label="Entry Requirements"
                  isMulti={true}
                  value={ENTRY_REQUIREMENT_OPTIONS.filter((o) =>
                    field.value.includes(o.value),
                  )}
                  options={ENTRY_REQUIREMENT_OPTIONS}
                  onChange={(options) => {
                    field.onChange(options ? options.map((o) => o.value) : []);
                  }}
                  isViewMode={isViewMode}
                />
              )}
            />

            <Controller
              name="referralRequirement"
              control={control}
              render={({ field }) => (
                <Dropdown
                  label="Referral Requirements"
                  isMulti={true}
                  value={REFERRAL_REQUIREMENT_OPTIONS.filter((o) =>
                    field.value.includes(o.value),
                  )}
                  options={REFERRAL_REQUIREMENT_OPTIONS}
                  onChange={(options) => {
                    field.onChange(options ? options.map((o) => o.value) : []);
                  }}
                  isViewMode={isViewMode}
                />
              )}
            />
          </Form.Block>

          <Form.Block>
            <Controller
              name="vaccinationRequirement"
              control={control}
              render={({ field }) => (
                <Dropdown
                  label="Vaccination Requirements"
                  isMulti={true}
                  value={VACCINATION_REQUIREMENT_OPTIONS.filter((o) =>
                    field.value.includes(o.value),
                  )}
                  options={VACCINATION_REQUIREMENT_OPTIONS}
                  onChange={(options) => {
                    field.onChange(options ? options.map((o) => o.value) : []);
                  }}
                  isViewMode={isViewMode}
                />
              )}
            />
            <Controller
              name="bedFees"
              control={control}
              render={({ field }) => (
                <Input
                  label="Bed Fees"
                  dataType="string"
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  disabled={disabled}
                  isViewMode={isViewMode}
                  error={errors.bedFees?.message}
                />
              )}
            />

            <Controller
              name="programFees"
              control={control}
              render={({ field }) => (
                <Input
                  label="Program Fees"
                  dataType="string"
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  disabled={disabled}
                  isViewMode={isViewMode}
                  error={errors.programFees?.message}
                />
              )}
            />
          </Form.Block>

          <Controller
            name="entryInfo"
            control={control}
            render={({ field }) => (
              <RichTextEditor
                label="Entry Info"
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                disabled={disabled}
                isViewMode={isViewMode}
                error={errors.entryInfo?.message}
              />
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
