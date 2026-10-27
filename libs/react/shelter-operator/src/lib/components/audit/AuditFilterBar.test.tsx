import { MockedProvider } from '@apollo/client/testing/react';
import { AuditTargetType } from '@monorepo/ba-platform/types';
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { AuditFilterBar } from './AuditFilterBar';
import { AuditActorsDocument } from '../../hooks/useAuditActors/__generated__/useAuditActors.generated';

class ResizeObserverStub {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
}
(globalThis as unknown as { ResizeObserver: unknown }).ResizeObserver =
  ResizeObserverStub;

const actorVariables = (search: string) => ({
  targetType: AuditTargetType.Bed,
  objectId: '7',
  search,
  limit: 20,
});

function actorMock(search: string, calls?: string[]) {
  return {
    request: {
      query: AuditActorsDocument,
      variables: actorVariables(search),
    },
    result: () => {
      calls?.push(search);
      return {
        data: {
          objectAuditActors: [
            {
              __typename: 'AuditActorType',
              id: 'user-1',
              label: 'Ada Lovelace',
              isSystem: false,
            },
          ],
        },
      };
    },
  };
}

function systemActorMock(search: string) {
  return {
    request: {
      query: AuditActorsDocument,
      variables: actorVariables(search),
    },
    result: () => ({
      data: {
        objectAuditActors: [
          {
            __typename: 'AuditActorType',
            id: null,
            label: 'System',
            isSystem: true,
          },
        ],
      },
    }),
  };
}

function renderBar(
  mocks: ReadonlyArray<unknown> = [],
  onChange: (filters: unknown) => void = () => undefined,
) {
  return render(
    <MockedProvider mocks={mocks as never} showWarnings={false}>
      <AuditFilterBar
        targetType={AuditTargetType.Bed}
        objectId="7"
        onChange={onChange}
      />
    </MockedProvider>,
  );
}

describe('AuditFilterBar', () => {
  /** The date preset is the first of the two comboboxes (actor search is the other). */
  function openDatePresets() {
    const [datePreset] = screen.getAllByRole('combobox');
    expect(datePreset).toBeDefined();
    fireEvent.click(datePreset);
  }

  it('applies a shared preset range', async () => {
    const onChange = vi.fn();
    renderBar([], onChange);

    openDatePresets();
    fireEvent.click(await screen.findByText('Last 7 Days'));

    expect(onChange).toHaveBeenCalledWith({
      dateFrom: expect.any(String),
      dateTo: expect.any(String),
    });
  });

  it('opens the shared date picker for a custom range', async () => {
    renderBar();

    openDatePresets();
    fireEvent.click(await screen.findByText('Custom'));

    expect(
      await screen.findByRole('dialog', { name: 'Select date range' }),
    ).not.toBeNull();
  });

  it('queries actors only after two debounced characters', async () => {
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

    const cleared = onChange.mock.calls.at(-1)?.[0];
    expect(cleared).not.toHaveProperty('actorId');
    expect(cleared).not.toHaveProperty('systemOnly');
    expect(screen.getByPlaceholderText('Search actors')).not.toBeNull();
  });

  it('filters system events when the system actor is selected', async () => {
    const onChange = vi.fn();

    renderBar([systemActorMock('sys')], onChange);

    const input = screen.getByPlaceholderText('Search actors');
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: 'sys' } });

    fireEvent.click(await screen.findByRole('option', { name: 'System' }));

    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ systemOnly: true }),
    );
    expect(onChange.mock.calls.at(-1)?.[0]).not.toHaveProperty('actorId');
    expect(screen.getByText('System')).not.toBeNull();
  });
});
