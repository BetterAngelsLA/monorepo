import { AuditEventKind, AuditTargetType } from '@monorepo/ba-platform/types';
import { fireEvent, render, screen } from '@testing-library/react';
import type { AuditAction, AuditEvent } from '../../hooks';
import { AuditActionRow } from './AuditActionRow';

function makeEvent(overrides: Partial<AuditEvent>): AuditEvent {
  return {
    __typename: 'AuditEventType',
    timestamp: '2026-07-01T12:00:00Z',
    actor: 'Ada Lovelace',
    kind: AuditEventKind.Insert,
    action: 'bed.add',
    targetType: AuditTargetType.Bed,
    targetId: '7',
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
    summary: 'Ada Lovelace created bed 7',
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
              targetType: AuditTargetType.Room,
              targetId: '3',
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
              targetType: AuditTargetType.Shelter,
              targetId: '5',
              fieldChanges: { name: ['Shelter A', 'Shelter B'] },
            }),
          ],
        })}
      />,
    );

    expect(screen.getByText('Name:')).not.toBeNull();
    expect(screen.getByText('Shelter B')).not.toBeNull();
  });

  it('keeps event rows in the expanded details', () => {
    render(
      <AuditActionRow
        action={makeAction({
          events: [makeEvent({ summary: 'Created Bed A (7)' })],
        })}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /details/i }));

    expect(screen.getAllByText('Created Bed A (7)')).toHaveLength(2);
    expect(
      screen.getByRole('button', { name: /hide details/i }),
    ).not.toBeNull();
  });
});
