import { useMutation } from '@apollo/client/react';
import { gql } from '@apollo/client';
import { operatorPath, useUser } from '@monorepo/react/shelter';
import { Input, toError } from '@monorepo/react/shared';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/base-ui/buttons';

export function CreateOrganizationPage() {
  const { refetchUser } = useUser();
  const navigate = useNavigate();
  const [orgName, setOrgName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [createOrganization] = useMutation(
    gql`
      mutation CreateOrganization($data: CreateOrganizationInput!) {
        createOrganization(data: $data) {
          user { id email firstName lastName }
          organization { id name }
        }
      }
    `
  );

  const handleCreateOrg = async () => {
    if (!orgName.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      await createOrganization({
        variables: { data: { organizationName: orgName.trim() } },
      });
      await refetchUser();
      navigate(operatorPath);
    } catch (err) {
      setError(toError(err).message);
    } finally {
      setSubmitting(false);
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

        {error && (
          <p className="text-alert-60 text-sm mb-4">{error}</p>
        )}

        <Button
          size="2xl"
          variant="accent"
          onClick={handleCreateOrg}
          disabled={submitting || !orgName.trim()}
          className="w-full"
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
