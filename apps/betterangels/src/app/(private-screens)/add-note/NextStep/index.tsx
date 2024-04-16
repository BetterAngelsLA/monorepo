import { SolidCircleIcon } from '@monorepo/expo/shared/icons';
import { Colors, Spacings } from '@monorepo/expo/shared/static';
import { BodyText, FieldCard, H5 } from '@monorepo/expo/shared/ui-components';
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import NextStepInput from './NextStepInput';

interface INextStepProps {
  expanded: string | undefined | null;
  setExpanded: (expanded: string | undefined | null) => void;
  noteId: string | undefined;
}

type TNextSteps = {
  action: string;
  date?: string;
  time?: string;
}[];

export default function NextStep(props: INextStepProps) {
  const { expanded, setExpanded, noteId } = props;
  const [nextSteps, setNextSteps] = useState<TNextSteps>([]);

  const isNextStep = expanded === 'Next Step';

  const isZeroNextSteps = nextSteps.length === 0;

  const hasValidActions = nextSteps.some((item) => item.action);

  useEffect(() => {
    if (!isNextStep) {
      const filteredNextSteps = nextSteps.filter((field) => !!field.action);
      setNextSteps(filteredNextSteps);
    }
  }, [expanded]);

  return (
    <FieldCard
      expanded={expanded}
      mb="xs"
      setExpanded={() => {
        if (isZeroNextSteps) {
          setNextSteps([{ action: '', date: '', time: '' }]);
        }

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
        {nextSteps.map((item, index) => (
          <NextStepInput
            key={index}
            index={index}
            nextStep={item}
            setNextSteps={setNextSteps}
            noteId={noteId}
            nextSteps={nextSteps}
          />
        ))}
        <H5
          textAlign="right"
          color={Colors.PRIMARY}
          onPress={() =>
            setNextSteps([...nextSteps, { action: '', date: '', time: '' }])
          }
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
            nextSteps.map((action, index) => (
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
