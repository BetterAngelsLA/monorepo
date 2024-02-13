import { BodyText, FieldCard } from '@monorepo/expo/shared/ui-components';
import { useFormContext } from 'react-hook-form';

interface IQuestion1Props {
  expanded: string | undefined | null;
  setExpanded: (e: string | undefined | null) => void;
}

export default function Question1(props: IQuestion1Props) {
  const { expanded, setExpanded } = props;
  const { control, watch } = useFormContext();

  const question3 = watch('question3');
  const isQuesiton3 = expanded === 'Question3';

  return (
    <FieldCard
      expanded={expanded}
      mb="xs"
      setExpanded={() => {
        setExpanded(isQuesiton3 ? null : 'Question3');
      }}
      title="3. If you checked off any problems, how difficult have these problems made it for you to do your work, take care of things at home, or get along with other people?"
      actionName={''}
    >
      {isQuesiton3 && <BodyText>question 3</BodyText>}
    </FieldCard>
  );
}
