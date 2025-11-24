import {
  DatePicker,
  Form,
  SingleSelect,
} from '@monorepo/expo/shared/ui-components';
import { format, isValid, parse, parseISO } from 'date-fns';
import { useMemo } from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import {
  enumHmisDobQuality,
  enumHmisVeteranStatusEnum,
} from '../../../../static';
import { TPersonalInfoFormSchema } from './formSchema';

const YMD = 'yyyy-MM-dd';

const coerceDobToDate = (value?: string | Date | null) => {
  if (!value) return undefined;
  if (value instanceof Date) return isValid(value) ? value : undefined;

  const s = String(value).trim();
  if (!s) return undefined;

  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    const d = parse(s, YMD, new Date());
    return isValid(d) ? d : undefined;
  }
  const d = parseISO(s);
  return isValid(d) ? d : undefined;
};

export function PersonalInfoFormHmis() {
  const {
    control,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useFormContext<TPersonalInfoFormSchema>();

  const birthDateStr = (watch('birthDate') as string | undefined) || '';

  const birthDate = useMemo(
    () => coerceDobToDate(birthDateStr),
    [birthDateStr]
  );

  return (
    <Form>
      <Form.Fieldset>
        <DatePicker
          label="Date of Birth"
          type="numeric"
          validRange={{
            endDate: new Date(),
            startDate: new Date('1900-01-01'),
          }}
          value={birthDate}
          onChange={(date) => {
            const next = date && isValid(date) ? format(date, YMD) : '';
            setValue('birthDate', next, {
              shouldDirty: true,
              shouldValidate: true,
            });
          }}
        />
        <Controller
          name="dobQuality"
          control={control}
          render={({ field: { value, onChange } }) => (
            <SingleSelect
              allowSelectNone={true}
              disabled={isSubmitting}
              label="DOB Data Quality"
              placeholder="Select quality"
              maxRadioItems={0}
              items={Object.entries(enumHmisDobQuality).map(
                ([val, displayValue]) => ({ value: val, displayValue })
              )}
              selectedValue={value}
              onChange={(value) => onChange(value || '')}
              error={errors.dobQuality?.message}
            />
          )}
        />

        <Controller
          name="veteran"
          control={control}
          render={({ field: { value, onChange } }) => (
            <SingleSelect
              allowSelectNone={true}
              disabled={isSubmitting}
              label="Veteran Status"
              placeholder="Select status"
              maxRadioItems={0}
              items={Object.entries(enumHmisVeteranStatusEnum).map(
                ([val, displayValue]) => ({ value: val, displayValue })
              )}
              selectedValue={value}
              onChange={(value) => onChange(value || '')}
              error={errors.veteran?.message}
            />
          )}
        />
      </Form.Fieldset>
    </Form>
  );
}
