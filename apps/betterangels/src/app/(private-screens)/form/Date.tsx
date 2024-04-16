import {
  BodyText,
  DatePicker,
  FieldCard,
  H5,
} from '@monorepo/expo/shared/ui-components';
import { useFormContext } from 'react-hook-form';

interface IDateProps {
  expanded: string | undefined | null;
  setExpanded: (expanded: string | undefined | null) => void;
}

const endOfDay = new Date(new Date().setHours(23, 59, 59, 999));

export default function DateComponent(props: IDateProps) {
  const { expanded, setExpanded } = props;
  const { watch } = useFormContext();

  const dateValue = watch('date');
  const isDate = expanded === 'Date';

  return (
    <FieldCard
      expanded={expanded}
      mb="xs"
      setExpanded={() => {
        setExpanded(isDate ? null : 'Date');
      }}
      title="Date"
      actionName={
        !dateValue && !isDate ? (
          <H5 size="sm">Add Date</H5>
        ) : (
          <BodyText>{dateValue}</BodyText>
        )
      }
    >
      {isDate && (
        <DatePicker
          mode="date"
          format="MM/dd/yy"
          mb="md"
          maxDate={endOfDay}
          onSave={(e) => console.log(e)}
        />
      )}
    </FieldCard>
  );
}
