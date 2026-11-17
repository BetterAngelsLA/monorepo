import { zodResolver } from '@hookform/resolvers/zod';
import { mergeCss } from '@monorepo/react/shared';
import { RoomStyleChoices } from '@monorepo/react/shelter';
import { useMemo } from 'react';
import type { UseFormSetError } from 'react-hook-form';
import { Controller, useForm } from 'react-hook-form';
import { ComboBox } from '../../../base-ui/combo-box';
import { Input } from '../../../base-ui/input';
import { RichTextEditor } from '../../../base-ui/richTextEditor';
import { Form } from '../../../form/Form';
import { ROOM_STYLE_OPTIONS, SEARCHABLE_DROPDOWN_MIN } from '../../constants';
import {
  defaultFormValues,
  formSchema,
  SleepingDetailsFormData,
} from './formSchema';
import { NumberField } from './NumberField';

type TProps = {
  values?: Partial<SleepingDetailsFormData>;
  onSubmit: (
    data: SleepingDetailsFormData,
    setError: UseFormSetError<SleepingDetailsFormData>,
  ) => void;
  isViewMode?: boolean;
  onEditClick?: () => void;
  onCancel?: () => void;
  disabled?: boolean;
  className?: string;
};

export function ShelterSleepingDetailsForm(props: TProps) {
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
  } = useForm<SleepingDetailsFormData>({
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
          title="Sleeping Details"
          onEditClick={isViewMode ? onEditClick : undefined}
          className="pl-5"
        />

        <Form.Content>
          <Form.Block columns={3}>
            <ComboBox
              control={control}
              name="roomStyles"
              inputName="roomStylesOther"
              label="Room Styles"
              inputLabel="Other Room Style"
              options={ROOM_STYLE_OPTIONS}
              isSearchable={ROOM_STYLE_OPTIONS.length > SEARCHABLE_DROPDOWN_MIN}
              triggerValue={RoomStyleChoices.Other}
              inputMaxLength={255}
              inputError={errors.roomStylesOther?.message}
              isViewMode={isViewMode}
              disabled={disabled}
            />
          </Form.Block>
          <Form.Block columns={3}>
            <NumberField
              control={control}
              name="totalBeds"
              label="Total Beds"
              error={errors.totalBeds?.message}
              disabled={disabled}
              isViewMode={isViewMode}
            />
            <NumberField
              control={control}
              name="nonRestrictedBeds"
              label="Available Unrestricted Beds"
              error={errors.nonRestrictedBeds?.message}
              disabled={disabled}
              isViewMode={isViewMode}
            />

            <NumberField
              control={control}
              name="restrictedBeds"
              label="Available Restricted Beds"
              error={errors.restrictedBeds?.message}
              disabled={disabled}
              isViewMode={isViewMode}
            />
          </Form.Block>
          <Controller
            name="restrictionNotes"
            control={control}
            render={({ field }) => (
              <Input
                label="Restriction Notes"
                variant="paragraph"
                rows={3}
                value={field.value ?? ''}
                onChange={(event) => field.onChange(event.target.value)}
                onBlur={field.onBlur}
                disabled={disabled}
                isViewMode={isViewMode}
                error={errors.restrictionNotes?.message}
              />
            )}
          />

          <Controller
            name="addNotesSleepingDetails"
            control={control}
            render={({ field }) => (
              <RichTextEditor
                label="Additional Notes"
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                disabled={disabled}
                isViewMode={isViewMode}
                error={errors.addNotesSleepingDetails?.message}
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
