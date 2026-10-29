import { AuditEventKind } from '@monorepo/ba-platform/types';
import { fireEvent, render, screen } from '@testing-library/react';
import type { AuditAction, AuditEvent } from '../../hooks';
import { AuditActionRow } from './AuditActionRow';

function makeEvent(overrides: Partial<AuditEvent>): AuditEvent {
  return {
    __typename: 'AuditEventType',
    timestamp: '2026-07-01T12:00:00Z',
    kind: AuditEventKind.Insert,
    action: 'bed.add',
    fieldChanges: {},
    context: null,
    summary: null,
    ...overrides,
  } as AuditEvent;
}

function makeAction(overrides: Partial<AuditAction>): AuditAction {
  return {
    __typename: 'AuditActionType',
    timestamp: '2026-07-01T12:00:00Z',
    actor: 'Ada Lovelace',
    truncated: false,
    fieldChanges: {},
    events: [],
    ...overrides,
  } as AuditAction;
}

describe('AuditActionRow', () => {
  it('shows summary lines without expanding a bed-only action', () => {
    render(
      <AuditActionRow
        action={makeAction({
          events: [makeEvent({ summary: 'Created Bed A (7)' })],
        })}
      />,
    );

    expect(screen.getByText('Created Bed A (7)')).not.toBeNull();
  });

  it('renders every summary line of a multi-object action', () => {
    render(
      <AuditActionRow
        action={makeAction({
          events: [
            makeEvent({ summary: 'Created Bed A (7)' }),
            makeEvent({
              summary: 'Updated Room B (3)',
              action: 'room.update',
            }),
          ],
        })}
      />,
    );

    expect(screen.getByText('Created Bed A (7)')).not.toBeNull();
    expect(screen.getByText('Updated Room B (3)')).not.toBeNull();
  });

  it('still renders action-level field changes for detailed events', () => {
    render(
      <AuditActionRow
        action={makeAction({
          fieldChanges: { name: ['Shelter A', 'Shelter B'] },
          events: [
            makeEvent({
              action: 'shelter.update',
              fieldChanges: { name: ['Shelter A', 'Shelter B'] },
            }),
          ],
        })}
      />,
    );

    expect(screen.getByText('Name:')).not.toBeNull();
    expect(screen.getByText('Shelter B')).not.toBeNull();
  });

  it('labels related choice values in the default card view', () => {
    render(
      <AuditActionRow
        action={makeAction({
          fieldChanges: {
            Storage: [[], ['shared_storage']],
            Parking: [['street'], ['motorcycle']],
            Pets: [[], ['pet_area']],
            'Shelter types': [[], ['safe_parking']],
          },
          events: [],
        })}
      />,
    );

    expect(screen.getByText(/Shared Storage/)).not.toBeNull();
    expect(screen.getByText(/Street Parking/)).not.toBeNull();
    expect(screen.getByText(/Pet Area/)).not.toBeNull();
    expect(screen.getByText(/Safe Parking/)).not.toBeNull();
    expect(screen.queryByText(/shared_storage/)).toBeNull();
  });

  it('keeps event rows in the expanded details', () => {
    render(
      <AuditActionRow
        action={makeAction({
          events: [makeEvent({ summary: 'Created Bed A (7)' })],
        })}
      />,
    );

    const toggle = screen.getByRole('button', { name: /details/i });

    expect(toggle.getAttribute('aria-expanded')).toBe('false');
    expect(toggle.getAttribute('aria-controls')).toBeNull();

    fireEvent.click(toggle);

    expect(screen.getAllByText('Created Bed A (7)')).toHaveLength(2);
    expect(
      screen.getByRole('button', { name: /hide details/i }),
    ).not.toBeNull();
    expect(toggle.getAttribute('aria-expanded')).toBe('true');

    const controls = toggle.getAttribute('aria-controls');

    expect(controls).not.toBeNull();
    expect(document.getElementById(controls as string)).not.toBeNull();
  });
});
