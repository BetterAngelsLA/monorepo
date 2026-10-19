import { render } from '@testing-library/react-native';
import { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useOrgTeams } from '../../../hooks';
import { FilterTeamsOptions } from './FilterTeamsOptions';

vi.mock('../../../hooks', () => ({
  useOrgTeams: vi.fn(),
}));

// The shared barrel reaches expo-router, which the native engine cannot link in
// this spec. Only the messages are under test, so the picker itself is stubbed.
vi.mock('@monorepo/expo/shared/ui-components', async () => {
  const { Text } = await import('react-native');

  return {
    TextRegular: ({ children }: { children: ReactNode }) => (
      <Text>{children}</Text>
    ),
    Filters: {
      Screen: ({ children }: { children: ReactNode }) => <>{children}</>,
    },
    MultiSelect_V2: () => null,
  };
});

const useOrgTeamsMock = vi.mocked(useOrgTeams);

function mockTeams(
  overrides: Partial<ReturnType<typeof useOrgTeams>> = {},
): void {
  useOrgTeamsMock.mockReturnValue({
    teams: [],
    totalCount: 0,
    loading: false,
    isIdle: false,
    error: undefined,
    ...overrides,
  });
}

const noop = () => undefined;

describe('FilterTeamsOptions', () => {
  beforeEach(() => {
    useOrgTeamsMock.mockReset();
  });

  it('prompts for an organization instead of showing an empty picker', async () => {
    mockTeams({ isIdle: true });

    const view = await render(
      <FilterTeamsOptions initialSelected={[]} onCommit={noop} />,
    );

    expect(
      view.getByText('Select an organization to filter by team.'),
    ).toBeTruthy();
  });

  it('reports a failed team load when an organization is active', async () => {
    const consoleError = vi
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);
    mockTeams({ error: new Error('boom') as never });

    const view = await render(
      <FilterTeamsOptions initialSelected={[]} onCommit={noop} />,
    );

    expect(view.getByText('Failed to load teams')).toBeTruthy();
    expect(consoleError).toHaveBeenCalledTimes(1);

    consoleError.mockRestore();
  });
});
