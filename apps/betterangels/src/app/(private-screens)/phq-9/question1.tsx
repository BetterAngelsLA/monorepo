import { BodyText, FieldCard } from '@monorepo/expo/shared/ui-components';
import { useFormContext } from 'react-hook-form';

interface IQuestion1Props {
  expanded: string | undefined | null;
  setExpanded: (e: string | undefined | null) => void;
}

export default function Question1(props: IQuestion1Props) {
  const { expanded, setExpanded } = props;
  const { control, watch } = useFormContext();

  const question1 = watch('question1');
  const isQuesiton1 = expanded === 'Question1';

  return (
    <FieldCard
      expanded={expanded}
      mb="xs"
      setExpanded={() => {
        setExpanded(isQuesiton1 ? null : 'Question1');
      }}
      title="1. Little interest or pleasure in doing things"
      actionName={''}
    >
      {isQuesiton1 && <BodyText>question 1</BodyText>}
    </FieldCard>
  );
}
