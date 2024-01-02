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
  expanded: string | undefined;
  setExpanded: (e: string | undefined) => void;
}

export default function Purpose(props: IPurposeProps) {
  const { expanded, setExpanded } = props;
  const { control, formState, setValue } = useFormContext();
  const { fields, append } = useFieldArray({
    name: 'purposes',
  });

  const purposes: TPurposes = useWatch({
    name: 'purposes',
    control,
  });

  const typedErrors = formState.errors as NoteFormErrors;

  useEffect(() => {
    if (expanded !== 'Purpose') {
      const requiredField = purposes[0];
      const filteredPurposes = purposes
        .slice(1)
        .filter((field) => !!field.value);
      setValue('purposes', [requiredField, ...filteredPurposes]);
    }
  }, [expanded]);

  return (
    <FieldCard
      expanded={expanded}
      setExpanded={() =>
        setExpanded(expanded === 'Purpose' ? undefined : 'Purpose')
      }
      error={!!typedErrors?.purposes}
      required
      mb="xs"
      actionName={
        !purposes.some((purpose) => purpose.value) && expanded !== 'Purpose' ? (
          <H5 size="sm">Add Purpose</H5>
        ) : (
          ''
        )
      }
      title="Purpose"
    >
      <View
        style={{
          paddingBottom: expanded === 'Purpose' ? Spacings.md : 0,
          height: expanded === 'Purpose' ? 'auto' : 0,
          overflow: 'hidden',
        }}
      >
        {fields.map((purpose, index) => (
          <Input
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
        {purposes.length > 0 &&
          purposes.length <= 10 &&
          purposes[purposes.length - 1].value && (
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

      {purposes.length > 0 && purposes[0].value && (
        <View
          style={{
            paddingBottom: expanded !== 'Purpose' ? Spacings.md : 0,
            height: expanded !== 'Purpose' ? 'auto' : 0,
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
