import {
  FieldCard,
  TextMedium,
  Input,
  TextRegular,
} from '@monorepo/expo/shared/ui-components';
import { useFormContext } from 'react-hook-form';

interface IHmisIdProps {
  expanded: string | undefined | null;
  setExpanded: (expanded: string | undefined | null) => void;
}

export default function HmisId(props: IHmisIdProps) {
  const { expanded, setExpanded } = props;
  const { control, watch } = useFormContext();

  const hmisId = watch('hmisId');
  const isHmisId = expanded === 'HMIS ID#';

  return (
    <FieldCard
      expanded={expanded}
      mb="xs"
      setExpanded={() => setExpanded(isHmisId ? null : 'HMIS ID#')}
      title="HMIS ID#"
      actionName={
        !hmisId && !isHmisId ? (
          <TextMedium size="sm">Add ID#</TextMedium>
        ) : (
          <TextRegular>{hmisId}</TextRegular>
        )
      }
    >
      {isHmisId && <Input mb="md" name="hmisId" control={control} />}
    </FieldCard>
  );
}
