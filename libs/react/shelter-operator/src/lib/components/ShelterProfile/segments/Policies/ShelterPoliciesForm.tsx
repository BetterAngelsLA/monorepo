import { zodResolver } from '@hookform/resolvers/zod';
import { mergeCss } from '@monorepo/react/shared';
import { ExitPolicyChoices } from '@monorepo/react/shelter';
import { Controller, useForm } from 'react-hook-form';
import { ComboBox } from '../../../base-ui/combo-box';
import { Dropdown } from '../../../base-ui/dropdown';
import { Input } from '../../../base-ui/input';
import { Form } from '../../../form/Form';
import {
  BOOLEAN_OPTIONS_WITH_UNKNOWN,
  EXIT_POLICY_OPTIONS,
} from '../../constants';
import { defaultFormValues, formSchema, PoliciesFormData } from './formSchema';

type TProps = {
  defaultValues?: Partial<PoliciesFormData>;
  onSubmit?: (data: PoliciesFormData) => void;
  isViewMode?: boolean;
  onEditClick?: () => void;
  onCancel?: () => void;
  disabled?: boolean;
  className?: string;
};

export function ShelterPoliciesForm(props: TProps) {
  const {
    defaultValues,
    onSubmit,
    isViewMode = false,
    onEditClick,
    onCancel,
    disabled = false,
    className,
  } = props;

  const {
    control,
    handleSubmit,
    formState: { errors, isValid },
    reset,
  } = useForm<PoliciesFormData>({
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
          title="Shelter Policies"
          onEditClick={isViewMode ? onEditClick : undefined}
          className="pl-5"
        />

        <form
          className="flex flex-col gap-10 mt-8"
          onSubmit={onSubmit ? handleSubmit(onSubmit) : undefined}
        >
          <Form.Block columns={3}>
            <Controller
              name="maxStay"
              control={control}
              render={({ field }) => (
                <Input
                  label="Maximum Stay (days)"
                  dataType="number"
                  value={field.value ?? ''}
                  min={0}
                  onChange={(event) => {
                    const value = event.target.valueAsNumber;

                    field.onChange(Number.isNaN(value) ? null : value);
                  }}
                  onBlur={field.onBlur}
                  disabled={disabled}
                  isViewMode={isViewMode}
                  error={errors.maxStay?.message}
                />
              )}
            />

            <Controller
              name="onSiteSecurity"
              control={control}
              render={({ field }) => (
                <Dropdown
                  label="On-Site Security"
                  value={
                    BOOLEAN_OPTIONS_WITH_UNKNOWN.find((option) => {
                      if (field.value === true) {
                        return option.value === 'true';
                      }

                      if (field.value === false) {
                        return option.value === 'false';
                      }

                      return option.value === 'null';
                    }) ?? null
                  }
                  options={[...BOOLEAN_OPTIONS_WITH_UNKNOWN]}
                  onChange={(option) => {
                    if (!option || option.value === 'null') {
                      field.onChange(null);

                      return;
                    }

                    field.onChange(option.value === 'true');
                  }}
                  isViewMode={isViewMode}
                />
              )}
            />

            <Controller
              name="visitorsAllowed"
              control={control}
              render={({ field }) => (
                <Dropdown
                  label="Visitors Allowed"
                  value={
                    BOOLEAN_OPTIONS_WITH_UNKNOWN.find((option) => {
                      if (field.value === true) {
                        return option.value === 'true';
                      }

                      if (field.value === false) {
                        return option.value === 'false';
                      }

                      return option.value === 'null';
                    }) ?? null
                  }
                  options={[...BOOLEAN_OPTIONS_WITH_UNKNOWN]}
                  onChange={(option) => {
                    if (!option || option.value === 'null') {
                      field.onChange(null);
                      return;
                    }
                    field.onChange(option.value === 'true');
                  }}
                  isViewMode={isViewMode}
                />
              )}
            />
          </Form.Block>

          <Form.Block>
            <ComboBox
              control={control}
              name="exitPolicy"
              inputName="exitPolicyOther"
              label="Exit Policy"
              inputLabel="Other Exit Policy"
              options={EXIT_POLICY_OPTIONS}
              triggerValue={ExitPolicyChoices.Other}
              inputError={errors.exitPolicyOther?.message}
              isViewMode={isViewMode}
              disabled={disabled}
            />

            <Controller
              name="emergencySurge"
              control={control}
              render={({ field }) => (
                <Dropdown
                  label="Emergency Surge Options"
                  value={
                    BOOLEAN_OPTIONS_WITH_UNKNOWN.find((option) => {
                      if (field.value === true) {
                        return option.value === 'true';
                      }

                      if (field.value === false) {
                        return option.value === 'false';
                      }

                      return option.value === 'null';
                    }) ?? null
                  }
                  options={[...BOOLEAN_OPTIONS_WITH_UNKNOWN]}
                  onChange={(option) => {
                    if (!option || option.value === 'null') {
                      field.onChange(null);

                      return;
                    }

                    field.onChange(option.value === 'true');
                  }}
                  isViewMode={isViewMode}
                />
              )}
            />
          </Form.Block>

          <Controller
            name="otherRules"
            control={control}
            render={({ field }) => (
              <Input
                label="Other Rules"
                variant="paragraph"
                inputClassName="min-h-auto"
                rows={2}
                dataType="string"
                value={field.value ?? ''}
                onChange={(event) => {
                  const value = event.target.value;
                  field.onChange(value === '' ? null : value);
                }}
                onBlur={field.onBlur}
                disabled={disabled}
                isViewMode={isViewMode}
                error={errors.otherRules?.message}
              />
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
