import { UserOrganizationPermissions } from '@monorepo/ba-platform/permissions';
import { MockedProvider } from '@apollo/client/testing/react';
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { AuditFilterBar } from './AuditFilterBar';
import { AuditActorsDocument } from '../../hooks/useAuditActors/__generated__/useAuditActors.generated';

const org = vi.hoisted(() => ({
  activeOrg: undefined as
    | { id: string; name: string; permissions: string[] }
    | undefined,
  permissions: [] as string[],
}));

vi.mock('@monorepo/ba-platform', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@monorepo/ba-platform')>()),
  useActiveOrg: () => ({
    activeOrg: org.activeOrg,
    organizations: [],
    setActiveOrgId: () => undefined,
    hasPermission: (permission: string) => org.permissions.includes(permission),
  }),
}));

class ResizeObserverStub {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
}
(globalThis as unknown as { ResizeObserver: unknown }).ResizeObserver =
  ResizeObserverStub;

function actorMock(search: string, calls?: string[]) {
  return {
    request: {
      query: AuditActorsDocument,
      variables: { organizationId: 'org-1', search },
    },
    result: () => {
      calls?.push(search);
      return {
        data: {
          organizationMembers: {
            __typename: 'OrganizationMemberTypeOffsetPaginated',
            results: [
              {
                __typename: 'OrganizationMemberType',
                id: 'user-1',
                firstName: 'Ada',
                lastName: 'Lovelace',
                email: 'ada@example.com',
              },
            ],
          },
        },
      };
    },
  };
}

function renderBar(
  mocks: ReadonlyArray<unknown> = [],
  onChange: (filters: unknown) => void = () => undefined,
) {
  return render(
    <MockedProvider mocks={mocks as never} showWarnings={false}>
      <AuditFilterBar onChange={onChange} />
    </MockedProvider>,
  );
}

describe('AuditFilterBar', () => {
  beforeEach(() => {
    org.activeOrg = undefined;
    org.permissions = [];
  });

  it('applies a shared preset range', async () => {
    const onChange = vi.fn();
    renderBar([], onChange);

    fireEvent.click(screen.getByRole('combobox'));
    fireEvent.click(await screen.findByText('Last 7 Days'));

    expect(onChange).toHaveBeenCalledWith({
      dateFrom: expect.any(String),
      dateTo: expect.any(String),
      actorId: null,
    });
  });

  it('opens the shared date picker for a custom range', async () => {
    renderBar();

    fireEvent.click(screen.getByRole('combobox'));
    fireEvent.click(await screen.findByText('Custom'));

    expect(
      await screen.findByRole('dialog', { name: 'Select date range' }),
    ).not.toBeNull();
  });

  it('queries actors only after two debounced characters', async () => {
    org.activeOrg = { id: 'org-1', name: 'Org', permissions: [] };
    org.permissions = [UserOrganizationPermissions.ViewOrgMembers];

    const calls: string[] = [];
    renderBar([actorMock('', calls), actorMock('ad', calls)]);

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 600));
    });
    expect(calls).toHaveLength(0);

    const input = screen.getByPlaceholderText('Search actors');
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: 'a' } });
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 400));
    });
    expect(calls).toHaveLength(0);

    fireEvent.change(input, { target: { value: 'ad' } });
    await waitFor(() => expect(calls).toEqual(['ad']));
    expect(await screen.findByText('Ada Lovelace')).not.toBeNull();
  });

  it('selects a searched actor with the keyboard', async () => {
    org.activeOrg = { id: 'org-1', name: 'Org', permissions: [] };
    org.permissions = [UserOrganizationPermissions.ViewOrgMembers];
    const onChange = vi.fn();

    renderBar([actorMock('ad')], onChange);

    const input = screen.getByPlaceholderText('Search actors');
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: 'ad' } });

    const option = await screen.findByRole('option', {
      name: 'Ada Lovelace',
    });
    fireEvent.keyDown(input, { key: 'ArrowDown' });
    expect(option.getAttribute('aria-selected')).toBe('true');

    fireEvent.keyDown(input, { key: 'Enter' });
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ actorId: 'user-1' }),
    );
  });

  it('applies and clears the selected actor', async () => {
    org.activeOrg = { id: 'org-1', name: 'Org', permissions: [] };
    org.permissions = [UserOrganizationPermissions.ViewOrgMembers];
    const onChange = vi.fn();

    renderBar([actorMock('ad')], onChange);

    const input = screen.getByPlaceholderText('Search actors');
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: 'ad' } });

    fireEvent.click(
      await screen.findByRole('option', { name: 'Ada Lovelace' }),
    );

    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ actorId: 'user-1' }),
    );
    expect(screen.queryByPlaceholderText('Search actors')).toBeNull();
    expect(screen.getByText('Ada Lovelace')).not.toBeNull();

    fireEvent.click(screen.getByLabelText('Clear actor filter'));

    expect(onChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ actorId: null }),
    );
    expect(screen.getByPlaceholderText('Search actors')).not.toBeNull();
  });

  it('does not render the actor filter without view_org_members', () => {
    org.activeOrg = { id: 'org-1', name: 'Org', permissions: [] };
    org.permissions = [];

    renderBar();

    expect(screen.queryByPlaceholderText('Search actors')).toBeNull();
  });
});
