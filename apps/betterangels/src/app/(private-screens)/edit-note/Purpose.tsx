import { SolidCircleIcon } from '@monorepo/expo/shared/icons';
import { Colors, Regex, Spacings } from '@monorepo/expo/shared/static';
import {
  BodyText,
  FieldCard,
  H5,
  Input,
} from '@monorepo/expo/shared/ui-components';
import { useEffect } from 'react';
import {
  FieldErrors,
  useFieldArray,
  useFormContext,
  useWatch,
} from 'react-hook-form';
import { View } from 'react-native';

interface INote {
  purposes: { value: string }[];
}

type TPurposes = {
  value: string;
}[];

type NoteFormErrors = FieldErrors<INote>;

interface IPurposeProps {
  expanded: string | undefined | null;
  setExpanded: (e: string | undefined | null) => void;
  notePurposes: TPurposes | undefined;
}

export default function Purpose(props: IPurposeProps) {
  const { expanded, setExpanded, notePurposes } = props;
  const { control, formState, setValue, trigger } = useFormContext();
  const { fields, append } = useFieldArray({
    name: 'purposes',
  });

  const purposes: TPurposes = useWatch({
    name: 'purposes',
    control,
  });
  const isPurpose = expanded === 'Purpose';
  const isGreaterThanZeroPurpses = purposes.length > 0;
  const isLessThanElevenPurpses = purposes.length < 11;
  const hasFirstValidPurpose = purposes[0].value;
  const lastPurposeHasValue = purposes[purposes.length - 1].value;
  const hasAnyValidPurpose = purposes.some((purpose) => purpose.value);

  const typedErrors = formState.errors as NoteFormErrors;
  const hasError = !!typedErrors.purposes;

  useEffect(() => {
    if (!isPurpose) {
      const requiredField = purposes[0];
      const filteredPurposes = purposes
        .slice(1)
        .filter((field) => !!field.value);
      setValue('purposes', [requiredField, ...filteredPurposes]);
    }
    if (!isPurpose && expanded === null) {
      trigger('purposes');
    }
  }, [expanded]);

  return (
    <FieldCard
      expanded={expanded}
      setExpanded={() => setExpanded(isPurpose ? null : 'Purpose')}
      error={!!typedErrors?.purposes}
      required
      mb="xs"
      actionName={
        !hasAnyValidPurpose && !isPurpose ? <H5 size="sm">Add Purpose</H5> : ''
      }
      title="Purpose"
    >
      {hasError && !isPurpose && (
        <BodyText mb="sm" size="sm" color={Colors.ERROR}>
          Please enter the purpose(s) of today's interaction
        </BodyText>
      )}
      <View
        style={{
          paddingBottom: isPurpose ? Spacings.md : 0,
          height: isPurpose ? 'auto' : 0,
          overflow: 'hidden',
        }}
      >
        {fields.map((purpose, index) => (
          <Input
            placeholder="Enter a purpose"
            key={purpose.id}
            mt={index !== 0 ? 'xs' : undefined}
            error={typedErrors?.purposes?.[0] && index === 0}
            rules={{
              required: index === 0,
              pattern: Regex.empty,
            }}
            control={control}
            name={`purposes[${index}].value`}
          />
        ))}
        {isGreaterThanZeroPurpses &&
          isLessThanElevenPurpses &&
          lastPurposeHasValue && (
            <H5
              mt="xs"
              textAlign="right"
              color={Colors.PRIMARY}
              onPress={() => append({ value: '' })}
              size="sm"
            >
              Add another Purpose
            </H5>
          )}
      </View>

      {isGreaterThanZeroPurpses && hasFirstValidPurpose && (
        <View
          style={{
            paddingBottom: !isPurpose ? Spacings.md : 0,
            height: !isPurpose ? 'auto' : 0,
            overflow: 'hidden',
          }}
        >
          {purposes.map((purpose, index) => (
            <View
              key={index}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                marginTop: index === 0 ? 0 : Spacings.xs,
              }}
            >
              <SolidCircleIcon size="sm" color={Colors.PRIMARY_EXTRA_DARK} />
              <BodyText ml="xs">{purpose.value}</BodyText>
            </View>
          ))}
        </View>
      )}
    </FieldCard>
  );
}
