import { useMutation } from '@apollo/client/react';
import { AppDrawer, Button, useAlert, useAppDrawer } from '@monorepo/react/components';
import { Input, mergeCss, toError } from '@monorepo/react/shared';
import { KeyboardEvent, useState } from 'react';
import { extractOperationInfoMessage } from '../../apollo/graphql/response/extractOperationInfoMessage';
import { CreateTeamDocument } from '../teams/__generated__/teams.generated';

type TProps = {
  className?: string;
  onSuccess: () => void;
};

export function AddTeamDrawer(props: TProps) {
  const { className, onSuccess } = props;
  const { closeDrawer } = useAppDrawer();
  const { showAlert } = useAlert();
  const [name, setName] = useState('');
  const [disabled, setDisabled] = useState(false);

  const [createTeam] = useMutation(CreateTeamDocument);

  const handleCreate = async () => {
    if (!name.trim()) return;
    setDisabled(true);
    try {
      const response = await createTeam({
        variables: { data: { name: name.trim() } },
      });
      const error = extractOperationInfoMessage(response, 'createTeam');
      if (error) throw new Error(error);
      showAlert({ type: 'success', content: `Team "${name.trim()}" created.` });
      closeDrawer();
      onSuccess();
    } catch (err) {
      showAlert({ type: 'error', content: toError(err).message });
    } finally {
      setDisabled(false);
    }
  };

  const parentCss = ['flex', 'flex-col', 'h-full', className];

  return (
    <div className={mergeCss(parentCss)}>
      <AppDrawer.Header>
        <div className="text-xl font-semibold text-neutral-20 leading-6">
          Add Team
        </div>
      </AppDrawer.Header>

      <div className="p-6">
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => {
            if (e.key === 'Enter') handleCreate();
          }}
          disabled={disabled}
          type="text"
          inputClassname="input-md w-96"
          label="Team Name"
          placeholder="e.g. Outreach Team Alpha"
          autoCapitalize="none"
          autoFocus
        />
      </div>

      <div className="mt-auto border-t border-neutral-90 p-6 flex justify-end items-center">
        <button
          type="button"
          className="mr-12 text-primary-20 text-base font-semibold"
          onClick={closeDrawer}
          disabled={disabled}
        >
          Cancel
        </button>

        <Button
          size="2xl"
          variant="accent"
          onClick={handleCreate}
          disabled={disabled || !name.trim()}
        >
          Create
        </Button>
      </div>
    </div>
  );
}
