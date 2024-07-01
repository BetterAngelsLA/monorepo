import { Spacings } from '@monorepo/expo/shared/static';
import {
  FieldCard,
  Radio,
  TextRegular,
} from '@monorepo/expo/shared/ui-components';
import { useFormContext } from 'react-hook-form';
import { View } from 'react-native';

interface IQuestionProps {
  expanded: string | undefined | null;
  setExpanded: (expanded: string | undefined | null) => void;
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

export default function Question(props: IQuestionProps) {
  const { expanded, setExpanded, title, field } = props;
  const { setValue, watch } = useFormContext();

  const question = watch(field);
  const isQuestion = expanded === field;

  return (
    <FieldCard
      expanded={expanded}
      mb="xs"
      setExpanded={() => {
        setExpanded(isQuestion ? null : field);
      }}
      title={title}
      actionName={''}
    >
      {isQuestion && (
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
      {!isQuestion && question?.label && (
        <TextRegular mb="md">{question.label}</TextRegular>
      )}
    </FieldCard>
  );
}
