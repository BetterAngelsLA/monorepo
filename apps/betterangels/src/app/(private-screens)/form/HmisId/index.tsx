import {
  BodyText,
  FieldCard,
  H5,
  Input,
} from '@monorepo/expo/shared/ui-components';
import { useFormContext } from 'react-hook-form';

interface IHmisIdProps {
  expanded: string | undefined | null;
  setExpanded: (e: string | undefined | null) => void;
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
          <H5 size="sm">Add ID#</H5>
        ) : (
          <BodyText>{hmisId}</BodyText>
        )
      }
    >
      {isHmisId && <Input mb="md" name="hmisId" control={control} />}
    </FieldCard>
  );
}
