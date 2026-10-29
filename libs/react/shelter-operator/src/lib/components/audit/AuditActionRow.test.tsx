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

    // Visible in the always-visible card body, not only in the expanded details.
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

  it('shows the schedule slot context on the collapsed card', () => {
    render(
      <AuditActionRow
        action={makeAction({
          fieldChanges: { 'Schedule 7 start time': ['09:00:00', '10:00:00'] },
          events: [
            makeEvent({
              action: 'shelter.schedule.update',
              context: { day: 'Monday', 'schedule type': 'Operating Hours' },
              fieldChanges: { 'start time': ['09:00:00', '10:00:00'] },
            }),
          ],
        })}
      />,
    );

    expect(
      screen.getByText('Day: Monday \u00b7 Schedule type: Operating Hours'),
    ).not.toBeNull();
  });

  it('shows a line per slot when an action nets several schedule slots', () => {
    render(
      <AuditActionRow
        action={makeAction({
          events: [
            makeEvent({
              action: 'shelter.schedule.update',
              context: { day: 'Monday', 'schedule type': 'Operating Hours' },
              fieldChanges: { 'start time': ['09:00:00', '10:00:00'] },
            }),
            makeEvent({
              action: 'shelter.schedule.update',
              context: { day: 'Tuesday', 'schedule type': 'Operating Hours' },
              fieldChanges: { 'start time': ['09:00:00', '10:00:00'] },
            }),
          ],
        })}
      />,
    );

    expect(
      screen.getByText('Day: Monday \u00b7 Schedule type: Operating Hours'),
    ).not.toBeNull();
    expect(
      screen.getByText('Day: Tuesday \u00b7 Schedule type: Operating Hours'),
    ).not.toBeNull();
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

    // One line in the card body, one in the expanded event row.
    expect(screen.getAllByText('Created Bed A (7)')).toHaveLength(2);
    expect(
      screen.getByRole('button', { name: /hide details/i }),
    ).not.toBeNull();
    expect(toggle.getAttribute('aria-expanded')).toBe('true');

    const controls = toggle.getAttribute('aria-controls');

    expect(controls).not.toBeNull();
    expect(document.getElementById(controls as string)).not.toBeNull();
  });

  it('flags an action whose event list was truncated', () => {
    render(
      <AuditActionRow
        action={makeAction({
          truncated: true,
          fieldChanges: { name: ['Bed A', 'Bed B'] },
          events: [makeEvent({ fieldChanges: { name: ['Bed A', 'Bed B'] } })],
        })}
      />,
    );

    expect(screen.getByText('Some events are not shown.')).not.toBeNull();
  });
});
