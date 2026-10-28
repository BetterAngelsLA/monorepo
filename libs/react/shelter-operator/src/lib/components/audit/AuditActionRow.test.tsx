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

  it('curates the schedule default on the collapsed card', () => {
    // Payload shape copied from a schedule create on a shelter log: the
    // action-level keys are qualified, so the rule has to match by suffix.
    render(
      <AuditActionRow
        action={makeAction({
          fieldChanges: {
            'Schedule 209 day': [null, 'Monday'],
            'Schedule 209 end time': [null, '10:00:00'],
            'Schedule 209 is exception': [null, false],
            'Schedule 209 start time': [null, '09:00:00'],
          },
          events: [
            makeEvent({
              action: 'shelter.schedule.add',
              context: { day: 'Monday', 'schedule type': 'Operating Hours' },
            }),
          ],
        })}
      />,
    );

    expect(screen.queryByText(/is exception/i)).toBeNull();
    expect(screen.getByText('Schedule 209 start time:')).not.toBeNull();
  });

  it('keeps a real is exception change on the card', () => {
    render(
      <AuditActionRow
        action={makeAction({
          fieldChanges: { 'Schedule 209 is exception': [false, true] },
          events: [makeEvent({ action: 'shelter.schedule.update' })],
        })}
      />,
    );

    expect(screen.getByText('Schedule 209 is exception:')).not.toBeNull();
  });

  it('shows one line when several slots share the same context', () => {
    const context = { day: 'Monday', 'schedule type': 'Operating Hours' };

    render(
      <AuditActionRow
        action={makeAction({
          events: [
            makeEvent({ action: 'shelter.schedule.update', context }),
            makeEvent({ action: 'shelter.schedule.update', context }),
          ],
        })}
      />,
    );

    expect(
      screen.getAllByText('Day: Monday \u00b7 Schedule type: Operating Hours'),
    ).toHaveLength(1);
  });

  it('renders no empty context block when a context has nothing to show', () => {
    const { container } = render(
      <AuditActionRow
        action={makeAction({
          // A context whose only entry has no fallback copy renders nothing; the
          // card must not leave the wrapper's spacing behind.
          events: [
            makeEvent({
              action: 'shelter.schedule.update',
              context: { condition: null },
            }),
          ],
        })}
      />,
    );

    expect(container.querySelector('.mt-3')).toBeNull();
  });
});
