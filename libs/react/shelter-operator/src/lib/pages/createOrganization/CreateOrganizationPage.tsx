import { operatorPath, useUser } from '@monorepo/react/shelter';
import { Input } from '@monorepo/react/shared';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/base-ui/buttons';
import { useCreateOrganization } from '../../hooks/useCreateOrganization';

export function CreateOrganizationPage() {
  const { refetchUser } = useUser();
  const navigate = useNavigate();
  const [orgName, setOrgName] = useState('');
  const { createOrganization, submitting, error } = useCreateOrganization();

  const handleCreateOrg = async () => {
    const ok = await createOrganization(orgName);
    if (ok) {
      await refetchUser();
      navigate(operatorPath);
    }
  };

  return (
    <div className="bg-neutral-99 flex min-h-screen items-center justify-center">
      <div className="rounded-3xl p-10 flex flex-col bg-white shadow-md w-[460px]">
        <h1 className="font-bold text-2xl mb-2">Create Your Organization</h1>
        <p className="mb-6 text-neutral-55">
          Create your shelter organization to get started managing shelters,
          rooms, and beds.
        </p>

        <div className="mb-4">
          <Input
            value={orgName}
            onChange={(e) => setOrgName(e.target.value)}
            disabled={submitting}
            type="text"
            inputClassname="input-xl"
            label="Organization Name"
            placeholder="Enter your organization name"
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleCreateOrg();
            }}
          />
        </div>

        {error && <p className="text-alert-60 text-sm mb-4">{error}</p>}

        <Button
          variant="floating"
          onClick={handleCreateOrg}
          disabled={submitting || !orgName.trim()}
          className="w-full justify-center text-lg py-4"
        >
          {submitting ? 'Creating...' : 'Create Organization'}
        </Button>

        <p className="mt-10 text-sm text-neutral-55 text-center">
          Already part of an organization?{' '}
          <span className="text-neutral-70">
            Reach out to your organization admin to be added.
          </span>
        </p>
      </div>
    </div>
  );
}
