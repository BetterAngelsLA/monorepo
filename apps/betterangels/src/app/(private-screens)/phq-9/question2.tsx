import { BodyText, FieldCard } from '@monorepo/expo/shared/ui-components';
import { useFormContext } from 'react-hook-form';

interface IQuestion1Props {
  expanded: string | undefined | null;
  setExpanded: (e: string | undefined | null) => void;
}

export default function Question1(props: IQuestion1Props) {
  const { expanded, setExpanded } = props;
  const { control, watch } = useFormContext();

  const question2 = watch('question2');
  const isQuesiton2 = expanded === 'Question2';

  return (
    <FieldCard
      expanded={expanded}
      mb="xs"
      setExpanded={() => {
        setExpanded(isQuesiton2 ? null : 'Question2');
      }}
      title="2. Thoughts that you would be better off dead, or of hurting yourself"
      actionName={''}
    >
      {isQuesiton2 && <BodyText>question 2</BodyText>}
    </FieldCard>
  );
}
