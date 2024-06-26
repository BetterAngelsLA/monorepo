import { ViewNoteQuery } from '@monorepo/expo/betterangels';
import { CircleSolidIcon } from '@monorepo/expo/shared/icons';
import { Colors, Spacings } from '@monorepo/expo/shared/static';
import {
  FieldCard,
  TextButton,
  TextMedium,
  TextRegular,
} from '@monorepo/expo/shared/ui-components';
import { RefObject, useEffect, useState } from 'react';
import { ScrollView, View } from 'react-native';
import NextStepInput from './NextStepInput';

interface INextStepProps {
  expanded: string | undefined | null;
  setExpanded: (expanded: string | undefined | null) => void;
  noteId: string | undefined;
  scrollRef: RefObject<ScrollView>;
  nextSteps: ViewNoteQuery['note']['nextSteps'];
}

type TNextSteps = {
  id?: string;
  action: string;
  date?: string;
  time?: string;
}[];

export default function NextStep(props: INextStepProps) {
  const {
    expanded,
    setExpanded,
    noteId,
    nextSteps: initialSteps,
    scrollRef,
  } = props;
  const [nextSteps, setNextSteps] = useState<TNextSteps | undefined>(undefined);

  const isNextStep = expanded === 'Next Step';
  const isZeroNextSteps = nextSteps && nextSteps.length === 0;

  const hasValidActions = nextSteps && nextSteps.some((item) => item.action);

  useEffect(() => {
    if (!isNextStep) {
      const filteredNextSteps =
        nextSteps && nextSteps.filter((field) => !!field.action);
      setNextSteps(filteredNextSteps);
    }
  }, [expanded]);

  useEffect(() => {
    if (initialSteps.length === 0) {
      setNextSteps([]);
      return;
    }

    const filteredNextSteps = initialSteps.map((item) => ({
      id: item.id,
      action: item.title,
    }));
    setNextSteps(filteredNextSteps);
  }, [initialSteps]);

  if (!nextSteps) return null;

  return (
    <FieldCard
      scrollRef={scrollRef}
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
        hasValidActions || isNextStep ? (
          ''
        ) : (
          <TextButton
            fontSize="sm"
            title={'Add Plan'}
            accessibilityHint={'Add Plan'}
            onPress={() => setExpanded(isNextStep ? null : 'Next Step')}
          />
        )
      }
    >
      <View
        style={{
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
        <TextMedium
          style={{ textAlign: 'right' }}
          color={Colors.PRIMARY}
          onPress={() =>
            setNextSteps([...nextSteps, { action: '', date: '', time: '' }])
          }
          size="sm"
        >
          Add another plan
        </TextMedium>
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
                <CircleSolidIcon size="md" color={Colors.PRIMARY_EXTRA_DARK} />
                <TextRegular ml="xs">{action.action}</TextRegular>
              </View>
            ))}
        </View>
      )}
    </FieldCard>
  );
}
