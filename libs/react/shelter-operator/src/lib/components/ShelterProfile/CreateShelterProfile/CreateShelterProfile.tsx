import { mergeCss } from '@monorepo/react/shared';
import { useState } from 'react';
import { Form } from '../../form/Form';

type TProps = {
  className?: string;
};

export function CreateShelterProfile(props: TProps) {
  const { className } = props;
  const [_disabled, _setDisabled] = useState<boolean>(false);

  return (
    <div className={mergeCss(['px-6 flex-col flex-1 pb-48', className])}>
      <Form className="flex-1">
        <Form.Header title="Create Shelter" className="pl-5" />

        <div className="flex flex-col gap-6 mt-8">placeholder</div>
      </Form>
    </div>
  );
}
