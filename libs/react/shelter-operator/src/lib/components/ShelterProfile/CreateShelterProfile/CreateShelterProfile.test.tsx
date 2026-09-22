import { ShelterPermissions } from '@monorepo/ba-platform/permissions';
import { StatusChoices } from '@monorepo/ba-platform/types';
import { act, render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import type { BasicInfoFormData } from '../segments/BasicInfo';
import { CreateShelterProfile } from './CreateShelterProfile';

type CapturedFormProps = {
  organizationField?: {
    options: readonly { label: string; value: string }[];
    isLoading?: boolean;
  };
  onSubmit: (
    data: BasicInfoFormData,
    setError: (name: string, error: { type: string; message: string }) => void,
  ) => Promise<void>;
};

const ORGS = [
  { id: 'org-1', name: 'Org One' },
  { id: 'org-2', name: 'Org Two' },
];

const FORM_DATA: BasicInfoFormData = {
  name: 'Test Shelter',
  status: StatusChoices.Draft,
  description: '',
  location: null,
  email: '',
  phone: '',
  website: '',
  isPrivate: false,
  organizationId: '',
};

const mocks = vi.hoisted(() => ({
  mutate: vi.fn(),
  useUser: vi.fn(),
  hasGlobalPermission: vi.fn(),
  useShelterOrganizations: vi.fn(),
  useActiveOrg: vi.fn(),
  showToast: vi.fn(),
  formProps: { current: undefined as CapturedFormProps | undefined },
}));

vi.mock('@apollo/client/react', () => ({
  useMutation: () => [mocks.mutate],
}));

vi.mock('@monorepo/ba-platform', () => ({
  BaError: class BaError extends Error {},
  getFieldErrorsOrThrow: () => [],
  useActiveOrg: () => mocks.useActiveOrg(),
}));

vi.mock('@monorepo/react/shelter', () => ({
  CreateShelterDocument: {},
  useUser: () => mocks.useUser(),
}));

vi.mock('../../../hooks', () => ({
  useShelterOrganizations: (options: { skip?: boolean }) =>
    mocks.useShelterOrganizations(options),
}));

vi.mock('../../base-ui/toast/state/useToast', () => ({
  useToast: () => ({ showToast: mocks.showToast }),
}));

vi.mock('../segments/BasicInfo', () => ({
  formFieldNames: [
    'name',
    'status',
    'description',
    'location',
    'email',
    'phone',
    'website',
    'isPrivate',
    'organizationId',
  ],
  ShelterBasicInfoForm: (props: CapturedFormProps) => {
    mocks.formProps.current = props;

    return null;
  },
}));

function renderCreateShelterProfile() {
  return render(
    <MemoryRouter initialEntries={['/operator/shelter/create']}>
      <CreateShelterProfile />
    </MemoryRouter>,
  );
}

async function submitForm(
  data: BasicInfoFormData,
  setError: (name: string, error: { type: string; message: string }) => void,
) {
  const props = mocks.formProps.current;

  if (!props) {
    throw new Error('ShelterBasicInfoForm was not rendered.');
  }

  await act(async () => {
    await props.onSubmit(data, setError);
  });
}

beforeEach(() => {
  vi.clearAllMocks();

  mocks.formProps.current = undefined;
  mocks.hasGlobalPermission.mockReturnValue(true);
  mocks.useUser.mockReturnValue({
    hasGlobalPermission: mocks.hasGlobalPermission,
  });
  mocks.useShelterOrganizations.mockReturnValue({
    organizations: ORGS,
    loading: false,
    error: undefined,
  });
  mocks.useActiveOrg.mockReturnValue({
    activeOrg: { id: 'org-active', name: 'Active Org' },
  });
  mocks.mutate.mockResolvedValue({
    data: { createShelter: { __typename: 'ShelterType', id: 'shelter-1' } },
  });
});

describe('CreateShelterProfile organization selection', () => {
  it('renders the organization dropdown with all shelter orgs for global operators', () => {
    renderCreateShelterProfile();

    expect(mocks.hasGlobalPermission).toHaveBeenCalledWith(
      ShelterPermissions.Add,
    );
    expect(mocks.useShelterOrganizations).toHaveBeenCalledWith({ skip: false });
    expect(mocks.formProps.current?.organizationField).toEqual({
      options: [
        { label: 'Org One', value: 'org-1' },
        { label: 'Org Two', value: 'org-2' },
      ],
      isLoading: false,
    });
  });

  it('hides the dropdown and skips the org query for org-scoped operators', () => {
    mocks.hasGlobalPermission.mockReturnValue(false);

    renderCreateShelterProfile();

    expect(mocks.useShelterOrganizations).toHaveBeenCalledWith({ skip: true });
    expect(mocks.formProps.current?.organizationField).toBeUndefined();
  });

  it('blocks submit with an inline error when no organization is selected', async () => {
    const setError = vi.fn();

    renderCreateShelterProfile();

    await submitForm(FORM_DATA, setError);

    expect(setError).toHaveBeenCalledWith('organizationId', {
      type: 'manual',
      message: 'Organization is required',
    });
    expect(mocks.mutate).not.toHaveBeenCalled();
  });

  it('creates the shelter under the selected organization', async () => {
    renderCreateShelterProfile();

    await submitForm({ ...FORM_DATA, organizationId: 'org-2' }, vi.fn());

    expect(mocks.mutate).toHaveBeenCalledWith({
      variables: {
        data: expect.objectContaining({ organizationId: 'org-2' }),
      },
    });
    expect(mocks.showToast).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'success' }),
    );
  });

  it('creates under the active organization for org-scoped operators', async () => {
    mocks.hasGlobalPermission.mockReturnValue(false);

    renderCreateShelterProfile();

    await submitForm(FORM_DATA, vi.fn());

    expect(mocks.mutate).toHaveBeenCalledWith({
      variables: {
        data: expect.objectContaining({ organizationId: 'org-active' }),
      },
    });
  });
});
