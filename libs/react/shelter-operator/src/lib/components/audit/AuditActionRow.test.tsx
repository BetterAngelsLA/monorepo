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

  it('renders one line per schedule slot instead of a column-per-field diff', () => {
    render(
      <AuditActionRow
        action={makeAction({
          fieldChanges: {
            'Schedule 204 day': [null, 'Thursday'],
            'Schedule 204 end time': [null, '16:00:00'],
            'Schedule 204 is exception': [null, false],
            'Schedule 204 shelter': [null, 'Gomez Family Sanctuary (id-12)'],
            'Schedule 204 start time': [null, '06:00:00'],
            'Schedule 204 schedule type': [null, 'Operating Hours'],
            'Schedule 176 day': ['Thursday', null],
            'Schedule 176 end time': ['18:00:00', null],
            'Schedule 176 start time': ['08:00:00', null],
            'Schedule 176 schedule type': ['Operating Hours', null],
          },
          events: [
            makeEvent({
              action: 'shelter.schedule.add',
              kind: AuditEventKind.Insert,
              fieldChanges: {
                day: [null, 'Thursday'],
                'end time': [null, '16:00:00'],
                'start time': [null, '06:00:00'],
                'schedule type': [null, 'Operating Hours'],
              },
            }),
            makeEvent({
              action: 'shelter.schedule.remove',
              kind: AuditEventKind.Delete,
              fieldChanges: {
                day: ['Thursday', null],
                'end time': ['18:00:00', null],
                'start time': ['08:00:00', null],
                'schedule type': ['Operating Hours', null],
              },
            }),
          ],
        })}
      />,
    );

    // Removals first, then additions: what was there, then what is there now.
    const lines = screen.getAllByText(/^(Added|Removed) Operating Hours/);

    expect(lines.map((line) => line.textContent)).toEqual([
      'Removed Operating Hours: Thursday 08:00 - 18:00',
      'Added Operating Hours: Thursday 06:00 - 16:00',
    ]);
    expect(lines[0].className).toContain('text-alert-60');
    expect(lines[1].className).toContain('text-success-30');
    // No row id, no shelter name, no one-sided pairs.
    expect(screen.queryByText(/Schedule 204/)).toBeNull();
    expect(screen.queryByText(/Gomez/)).toBeNull();
    expect(screen.queryByText(/\u2192/)).toBeNull();
  });

  it('shows the diff of an in-place schedule update instead of a line', () => {
    // An admin save has no slot identity, so the card cannot label it.
    render(
      <AuditActionRow
        action={makeAction({
          fieldChanges: { 'Schedule 204 start time': ['09:00:00', '10:00:00'] },
          events: [
            makeEvent({
              action: 'shelter.schedule.update',
              kind: AuditEventKind.Update,
              fieldChanges: { 'start time': ['09:00:00', '10:00:00'] },
            }),
          ],
        })}
      />,
    );

    expect(screen.queryByText(/Every day/)).toBeNull();
    expect(screen.getByText('Schedule 204 start time:')).not.toBeNull();
  });

  it('keeps non-schedule changes on a card that also replaces slots', () => {
    render(
      <AuditActionRow
        action={makeAction({
          fieldChanges: {
            name: ['Old Name', 'New Name'],
            'Schedule 204 start time': [null, '06:00:00'],
          },
          events: [
            makeEvent({
              action: 'shelter.schedule.add',
              kind: AuditEventKind.Insert,
              fieldChanges: {
                day: [null, 'Thursday'],
                'start time': [null, '06:00:00'],
                'end time': [null, '16:00:00'],
                'schedule type': [null, 'Operating Hours'],
              },
            }),
          ],
        })}
      />,
    );

    expect(screen.getByText('Name:')).not.toBeNull();
    expect(
      screen.getByText('Added Operating Hours: Thursday 06:00 - 16:00'),
    ).not.toBeNull();
    expect(screen.queryByText(/Schedule 204/)).toBeNull();
  });
});
