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

  it('renders one line per row of a save that deletes, edits and adds', () => {
    // One upsert can touch three rows; each is its own event and its own line.
    render(
      <AuditActionRow
        action={makeAction({
          fieldChanges: {
            'Schedule 320 start time': ['20:10:00', '17:23:00'],
            'Schedule 321 start time': ['16:23:00', '16:23:00'],
            'Schedule 322 start time': ['17:23:00', '19:23:00'],
          },
          events: [
            makeEvent({
              action: 'shelter.schedule.remove',
              kind: AuditEventKind.Delete,
              fieldChanges: {
                day: ['Wednesday', null],
                'start time': ['20:10:00', null],
                'end time': ['23:10:00', null],
                'schedule type': ['Operating Hours', null],
              },
            }),
            makeEvent({
              action: 'shelter.schedule.update',
              kind: AuditEventKind.Update,
              context: { day: 'Wednesday', 'schedule type': 'Operating Hours' },
              fieldChanges: {
                'start time': ['16:23:00', '17:23:00'],
                'end time': ['17:23:00', '20:23:00'],
              },
            }),
            makeEvent({
              action: 'shelter.schedule.add',
              kind: AuditEventKind.Insert,
              fieldChanges: {
                day: [null, 'Wednesday'],
                'start time': [null, '17:23:00'],
                'end time': [null, '19:23:00'],
                'schedule type': [null, 'Operating Hours'],
              },
            }),
          ],
        })}
      />,
    );

    // The whole set, in tone order: a duplicated or extra line would fail here.
    expect(
      screen
        .getAllByText(/^(Removed|Changed|Added) /)
        .map((element) => element.textContent),
    ).toEqual([
      'Removed Operating Hours: Wednesday 20:10 - 23:10',
      'Changed Operating Hours: Wednesday 16:23 - 17:23 \u2192 17:23 - 20:23',
      'Added Operating Hours: Wednesday 17:23 - 19:23',
    ]);
    // The lines replace the merged changes; nothing is repeated below them.
    expect(screen.queryByText(/Schedule 32/)).toBeNull();
  });

  it('renders a weekly line and an exception line from one save', () => {
    render(
      <AuditActionRow
        action={makeAction({
          fieldChanges: {
            'Schedule 1 start time': ['09:00:00', '10:00:00'],
            'Schedule 1 end time': ['17:00:00', '18:00:00'],
            'Schedule 2 end time': ['12:00:00', '14:00:00'],
          },
          events: [
            makeEvent({
              action: 'shelter.schedule.update',
              kind: AuditEventKind.Update,
              context: { day: 'Monday', 'schedule type': 'Operating Hours' },
              fieldChanges: {
                'start time': ['09:00:00', '10:00:00'],
                'end time': ['17:00:00', '18:00:00'],
              },
            }),
            makeEvent({
              action: 'shelter.schedule.update',
              kind: AuditEventKind.Update,
              context: {
                'schedule type': 'Operating Hours',
                'is exception': true,
                'start date': '2026-12-25',
                'end date': '2026-12-25',
              },
              fieldChanges: { 'end time': ['12:00:00', '14:00:00'] },
            }),
          ],
        })}
      />,
    );

    expect(
      screen.getAllByText(/^Changed /).map((element) => element.textContent),
    ).toEqual([
      'Changed Operating Hours: Monday 09:00 - 17:00 \u2192 10:00 - 18:00',
      'Changed Operating Hours (Exception): 2026-12-25 end time 12:00 \u2192 14:00',
    ]);
    // Both events render as lines, so neither change is left to the diff block.
    expect(screen.queryByText(/Schedule \d/)).toBeNull();
  });

  it('keeps an unlabelled schedule change when another row renders a line', () => {
    render(
      <AuditActionRow
        action={makeAction({
          fieldChanges: {
            'Schedule 1 start time': ['09:00:00', '10:00:00'],
            'Schedule 9 end time': ['12:00:00', '14:00:00'],
          },
          events: [
            makeEvent({
              action: 'shelter.schedule.update',
              kind: AuditEventKind.Update,
              context: { day: 'Monday', 'schedule type': 'Operating Hours' },
              fieldChanges: { 'start time': ['09:00:00', '10:00:00'] },
            }),
            makeEvent({
              action: 'shelter.schedule.update',
              kind: AuditEventKind.Update,
              context: null,
              fieldChanges: { 'end time': ['12:00:00', '14:00:00'] },
            }),
          ],
        })}
      />,
    );

    expect(
      screen.getByText(
        'Changed Operating Hours: Monday start time 09:00 \u2192 10:00',
      ),
    ).not.toBeNull();
    // The second row has no identity to label, so its change stays visible.
    expect(screen.getByText('Schedule 9 end time:')).not.toBeNull();
  });

  it('shows the diff of an unlabelled schedule update instead of a line', () => {
    // Rows written before the server sent the slot identity cannot be labelled.
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
