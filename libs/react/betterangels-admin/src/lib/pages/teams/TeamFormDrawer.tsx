import { useMutation } from '@apollo/client/react';
import { TeamType } from '@monorepo/ba-platform/types';
import {
  AppDrawer,
  Button,
  useAlert,
  useAppDrawer,
} from '@monorepo/react/components';
import { Dropdown, Input, mergeCss } from '@monorepo/react/shared';
import { KeyboardEvent, useState } from 'react';
import { extractOperationInfoMessage } from '../../apollo/graphql/response/extractOperationInfoMessage';
import {
  CreateTeamDocument,
  UpdateTeamDocument,
} from './__generated__/teams.generated';

type TProps = {
  className?: string;
  team?: TeamType;
  onSuccess: () => void;
};

export function TeamFormDrawer(props: TProps) {
  const { className, team, onSuccess } = props;
  const isEditing = !!team;
  const { closeDrawer } = useAppDrawer();
  const { showAlert } = useAlert();
  const [name, setName] = useState(team?.name ?? '');
  const [isActive, setIsActive] = useState<boolean>(team?.isActive !== false);
  const [disabled, setDisabled] = useState(false);

  const [createTeam] = useMutation(CreateTeamDocument);
  const [updateTeam] = useMutation(UpdateTeamDocument);

  const handleSubmit = async () => {
    if (!name.trim()) return;
    setDisabled(true);
    try {
      if (isEditing) {
        const response = await updateTeam({
          variables: { data: { id: team.id, name: name.trim(), isActive } },
        });
        const error = extractOperationInfoMessage(response, 'updateTeam');
        if (error) throw new Error(error);
        showAlert({
          type: 'success',
          content: `Team "${name.trim()}" updated.`,
        });
      } else {
        const response = await createTeam({
          variables: { data: { name: name.trim() } },
        });
        const error = extractOperationInfoMessage(response, 'createTeam');
        if (error) throw new Error(error);
        showAlert({
          type: 'success',
          content: `Team "${name.trim()}" created.`,
        });
      }
      closeDrawer();
      onSuccess();
    } catch (err) {
      console.error(err);
      showAlert({
        type: 'error',
        content: 'Sorry, something went wrong. Please try again.',
      });
    } finally {
      setDisabled(false);
    }
  };

  const parentCss = ['flex', 'flex-col', 'h-full', className];

  return (
    <div className={mergeCss(parentCss)}>
      <AppDrawer.Header>
        <div className="text-xl font-semibold text-neutral-20 leading-6">
          {isEditing ? 'Edit Team' : 'Add Team'}
        </div>
      </AppDrawer.Header>

      <div className="p-6 flex flex-col gap-4">
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => {
            if (e.key === 'Enter') void handleSubmit();
          }}
          disabled={disabled}
          type="text"
          inputClassname="input-md w-96"
          label="Team Name"
          placeholder="e.g. Outreach Team Alpha"
          autoCapitalize="none"
          autoFocus
        />

        {isEditing && (
          <Dropdown
            label="Status"
            value={isActive ? 'active' : 'inactive'}
            onChange={(v) => setIsActive(v === 'active')}
            disabled={disabled}
            selectClassname="w-96"
            options={[
              { value: 'active', label: 'Active' },
              { value: 'inactive', label: 'Inactive' },
            ]}
          />
        )}
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
          onClick={() => void handleSubmit()}
          disabled={disabled || !name.trim()}
        >
          Save
        </Button>
      </div>
    </div>
  );
}
