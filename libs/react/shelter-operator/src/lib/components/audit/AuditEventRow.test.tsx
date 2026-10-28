import { AuditEventKind, AuditTargetType } from '@monorepo/ba-platform/types';
import { render, screen } from '@testing-library/react';
import type { AuditEvent } from '../../hooks';
import { AuditEventRow } from './AuditEventRow';

function makeEvent(overrides: Partial<AuditEvent>): AuditEvent {
  return {
    __typename: 'AuditEventType',
    timestamp: '2026-07-01T12:00:00Z',
    actor: 'Ada Lovelace',
    kind: AuditEventKind.Update,
    action: 'bed.update',
    targetType: AuditTargetType.Bed,
    targetId: '7',
    fieldChanges: {},
    context: null,
    summary: null,
    ...overrides,
  } as AuditEvent;
}

describe('AuditEventRow', () => {
  it('renders a summary line and no field detail', () => {
    render(
      <AuditEventRow
        event={makeEvent({
          summary: 'Updated Bed A (7)',
          fieldChanges: { name: ['Bed A', 'Bed B'] },
        })}
      />,
    );

    expect(screen.getByText('Updated Bed A (7)')).not.toBeNull();
    expect(screen.queryByText('Bed B')).toBeNull();
    expect(screen.queryByText('Name:')).toBeNull();
  });

  it('renders field changes when there is no summary', () => {
    render(
      <AuditEventRow
        event={makeEvent({ fieldChanges: { name: ['Bed A', 'Bed B'] } })}
      />,
    );

    expect(screen.getByText('Bed')).not.toBeNull();
    expect(screen.getByText('Name:')).not.toBeNull();
    expect(screen.getByText('Bed B')).not.toBeNull();
  });
});
