import { SolidCircleIcon } from '@monorepo/expo/shared/icons';
import { Colors, Spacings } from '@monorepo/expo/shared/static';
import {
  BodyText,
  DatePicker,
  FieldCard,
  H3,
  H5,
  Input,
} from '@monorepo/expo/shared/ui-components';
import { useEffect } from 'react';
import { useFieldArray, useFormContext, useWatch } from 'react-hook-form';
import { View } from 'react-native';

interface INextStepProps {
  expanded: string | undefined | null;
  setExpanded: (e: string | undefined | null) => void;
}

type TNextSteps = {
  action: string;
  date?: Date;
  location?: string;
}[];

export default function NextStep(props: INextStepProps) {
  const { expanded, setExpanded } = props;
  const { control, setValue } = useFormContext();
  const { fields, append } = useFieldArray({
    name: 'nextStepActions',
  });

  const isNextStep = expanded === 'Next Step';

  const nextStepActions: TNextSteps = useWatch({
    name: 'nextStepActions',
    control,
  });
  const isZeroNextStepActions = nextStepActions.length === 0;

  const hasValidActions = nextStepActions.some((item) => item.action);

  useEffect(() => {
    if (!isNextStep) {
      const filteredNextSteps = nextStepActions.filter(
        (field) => !!field.action
      );
      setValue('nextStepActions', filteredNextSteps);
    }
  }, [expanded]);

  return (
    <FieldCard
      expanded={expanded}
      mb="xs"
      setExpanded={() => {
        if (isZeroNextStepActions)
          append({ action: '', date: '', location: '' });

        setExpanded(isNextStep ? null : 'Next Step');
      }}
      title="Next Step"
      actionName={
        hasValidActions || isNextStep ? '' : <H5 size="sm">Add Plan</H5>
      }
    >
      <View
        style={{
          paddingBottom: isNextStep ? Spacings.md : 0,
          height: isNextStep ? 'auto' : 0,
          overflow: 'hidden',
        }}
      >
        {fields.map((item, index) => (
          <View
            style={{ gap: Spacings.xs, marginBottom: Spacings.xs }}
            key={item.id}
          >
            {fields.length > 1 && <H3>Action {index + 1}</H3>}
            <Input
              control={control}
              name={`nextStepActions.${index}.action`}
              label="Action Item"
            />
            <DatePicker
              label="Date (optional)"
              control={control}
              mode="date"
              placeholder="MM/DD/YYYY"
              format="MM/dd/yyyy"
              name={`nextStepActions.${index}.date`}
            />
            <DatePicker
              label="Time (optional)"
              control={control}
              format="HH:mm"
              placeholder="HH:MM"
              mode="time"
              name={`nextStepActions.${index}.time`}
            />
          </View>
        ))}
        <H5
          textAlign="right"
          color={Colors.PRIMARY}
          onPress={() => append({ action: '', date: '', location: '' })}
          size="sm"
        >
          Add another plan
        </H5>
      </View>

      {hasValidActions && (
        <View
          style={{
            paddingBottom: !isNextStep ? Spacings.md : 0,
            height: !isNextStep ? 'auto' : 0,
            overflow: 'hidden',
          }}
        >
          {hasValidActions &&
            nextStepActions.map((action, index) => (
              <View
                key={index}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  marginTop: index === 0 ? 0 : Spacings.xs,
                }}
              >
                <SolidCircleIcon size="md" color={Colors.PRIMARY_EXTRA_DARK} />
                <BodyText ml="xs">{action.action + ' ' + action.date}</BodyText>
              </View>
            ))}
        </View>
      )}
    </FieldCard>
  );
}
