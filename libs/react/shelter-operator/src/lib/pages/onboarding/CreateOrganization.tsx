import { useMutation } from '@apollo/client/react';
import { useUser } from '@monorepo/react/shelter';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Input } from '../../components/base-ui/input';
import { CreateShelterOrganizationDocument } from '../../graphql/__generated__/organization.generated';

export function CreateOrganization() {
  const navigate = useNavigate();
  const { refetchUser } = useUser();
  const [orgName, setOrgName] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const [createOrg, { loading }] = useMutation(
    CreateShelterOrganizationDocument,
    {
      onCompleted: async (data) => {
        const result = data.createShelterOrganization;
        if (result.__typename === 'OrganizationType') {
          await refetchUser();
          navigate('/operator');
        } else if (result.__typename === 'OperationInfo') {
          const messages = result.messages ?? [];
          setErrorMsg(
            messages.map((m) => m.message).join(' ') ||
              'Failed to create organization.'
          );
        }
      },
      onError: (err) => {
        setErrorMsg(err.message || 'Something went wrong. Please try again.');
      },
    }
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!orgName.trim()) return;
    setErrorMsg('');
    createOrg({
      variables: { data: { organizationName: orgName.trim() } },
    });
  };

  return (
    <div className="bg-neutral-99 flex min-h-screen items-center justify-center">
      <div className="rounded-3xl p-10 flex flex-col bg-white shadow-md w-[520px]">
        <h1 className="font-bold text-2xl mb-2">Set Up Your Organization</h1>
        <p className="mb-8 text-gray-600">
          Create your shelter organization to start managing your properties.
        </p>

        <form className="flex flex-col" onSubmit={handleSubmit}>
          <Input
            className="mb-6"
            inputClassName="input-xl"
            label="Organization Name"
            value={orgName}
            onChange={(e) => setOrgName(e.target.value)}
            placeholder="e.g. Hope Shelter Network"
          />

          {!!errorMsg && (
            <p className="text-alert-60 text-sm mb-4">{errorMsg}</p>
          )}

          <button
            type="submit"
            className="btn btn-primary btn-xl"
            disabled={loading || !orgName.trim()}
          >
            {loading ? 'Creating…' : 'Create Organization'}
          </button>
        </form>
      </div>
    </div>
  );
}
