import { CalendarIcon, SolidCircleIcon } from '@monorepo/expo/shared/icons';
import { Colors, Spacings } from '@monorepo/expo/shared/static';
import {
  BodyText,
  DatePicker,
  FieldCard,
  H5,
  Input,
} from '@monorepo/expo/shared/ui-components';
import { useEffect } from 'react';
import { useFieldArray, useFormContext, useWatch } from 'react-hook-form';
import { View } from 'react-native';

interface INextStepProps {
  expanded: string | undefined;
  setExpanded: (e: string | undefined) => void;
}

type TNextSteps = {
  value: string;
}[];

export default function NextStep(props: INextStepProps) {
  const { expanded, setExpanded } = props;
  const { control, setValue, watch } = useFormContext();
  const { fields, append } = useFieldArray({
    name: 'nextStepActions',
  });

  const nextStepDate = watch('nextStepDate');
  const isNextStep = expanded === 'Next Step';

  const nextStepActions: TNextSteps = useWatch({
    name: 'nextStepActions',
    control,
  });
  const isZeroNextStepActions = nextStepActions.length === 0;

  const hasValidActions = nextStepActions.some((action) => action.value);

  useEffect(() => {
    if (!isNextStep) {
      const filteredNextSteps = nextStepActions.filter(
        (field) => !!field.value
      );
      setValue('nextStepActions', filteredNextSteps);
    }
  }, [expanded]);

  return (
    <FieldCard
      expanded={expanded}
      mb="xs"
      setExpanded={() => {
        if (isZeroNextStepActions) append({ value: '' });

        setExpanded(isNextStep ? undefined : 'Next Step');
      }}
      title="Next Step"
      actionName={
        hasValidActions || nextStepDate || isNextStep ? (
          ''
        ) : (
          <H5 size="sm">Add Plan</H5>
        )
      }
    >
      <View
        style={{
          paddingBottom: isNextStep ? Spacings.md : 0,
          height: isNextStep ? 'auto' : 0,
          overflow: 'hidden',
        }}
      >
        <DatePicker
          label="Date and Time"
          control={control}
          name={`nextStepDate`}
        />
        {fields.map((item, index) => (
          <View key={item.id}>
            <Input
              mt="xs"
              control={control}
              name={`nextStepActions.${index}.value`}
              label="Action Item"
            />
          </View>
        ))}
        <H5
          mt="xs"
          textAlign="right"
          color={Colors.PRIMARY}
          onPress={() => append({ value: '' })}
          size="sm"
        >
          Add another plan
        </H5>
      </View>

      {(hasValidActions || nextStepDate) && (
        <View
          style={{
            paddingBottom: !isNextStep ? Spacings.md : 0,
            height: !isNextStep ? 'auto' : 0,
            overflow: 'hidden',
          }}
        >
          {nextStepDate && (
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
              }}
            >
              <CalendarIcon size="sm" color={Colors.PRIMARY_EXTRA_DARK} />
              <BodyText ml="xs">{nextStepDate}</BodyText>
            </View>
          )}
          {hasValidActions &&
            nextStepActions.map((action, index) => (
              <View
                key={index}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  marginTop: index === 0 && !nextStepDate ? 0 : Spacings.xs,
                }}
              >
                <SolidCircleIcon size="sm" color={Colors.PRIMARY_EXTRA_DARK} />
                <BodyText ml="xs">{action.value}</BodyText>
              </View>
            ))}
        </View>
      )}
    </FieldCard>
  );
}
