import { Spacings } from '@monorepo/expo/shared/static';
import {
  BodyText,
  FieldCard,
  Radio,
} from '@monorepo/expo/shared/ui-components';
import { useFormContext } from 'react-hook-form';
import { View } from 'react-native';

interface IQuestion1Props {
  expanded: string | undefined | null;
  setExpanded: (e: string | undefined | null) => void;
  field: string;
  title: string;
}

const QUESTIONS = [
  {
    question: 'Not difficult at all',
    value: 0,
  },
  {
    question: 'Somewhat difficult',
    value: 1,
  },
  {
    question: 'Very difficult',
    value: 2,
  },
  {
    question: 'Extremely difficult',
    value: 3,
  },
];

export default function Question1(props: IQuestion1Props) {
  const { expanded, setExpanded, title, field } = props;
  const { setValue, watch } = useFormContext();

  const question = watch(field);
  const isQuesiton1 = expanded === field;

  return (
    <FieldCard
      expanded={expanded}
      mb="xs"
      setExpanded={() => {
        setExpanded(isQuesiton1 ? null : field);
      }}
      title={title}
      actionName={''}
    >
      {isQuesiton1 && (
        <View style={{ gap: Spacings.xs, marginBottom: Spacings.md }}>
          {QUESTIONS.map((q) => (
            <Radio
              accessibilityHint={`Select ${q.question}`}
              key={q.value}
              onPress={() =>
                setValue(field, { label: q.question, value: q.value })
              }
              value={question?.label}
              label={q.question}
            />
          ))}
        </View>
      )}
      {!isQuesiton1 && question?.label && (
        <BodyText mb="md">{question.label}</BodyText>
      )}
    </FieldCard>
  );
}
