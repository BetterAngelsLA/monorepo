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
          // A summary event should never carry changes, but pin the rendering
          // guard: if a payload ever did, the row must not show it.
          fieldChanges: { name: ['Bed A', 'Bed B'] },
        })}
      />,
    );

    expect(screen.getByText('Updated Bed A (7)')).not.toBeNull();
    expect(screen.queryByText('Bed B')).toBeNull();
    expect(screen.queryByText('Name:')).toBeNull();
  });

  it('renders the unchanged slot context of a netted schedule change', () => {
    render(
      <AuditEventRow
        event={makeEvent({
          action: 'shelter.schedule.update',
          context: { day: 'Monday', 'schedule type': 'Operating Hours' },
          fieldChanges: { 'start time': ['09:00:00', '10:00:00'] },
        })}
      />,
    );

    expect(
      screen.getByText('Day: Monday \u00b7 Schedule type: Operating Hours'),
    ).not.toBeNull();
    expect(screen.getByText('Start time:')).not.toBeNull();
  });

  it('renders "Every day" when the slot context has no day', () => {
    render(
      <AuditEventRow
        event={makeEvent({
          action: 'shelter.schedule.update',
          context: { day: null, 'schedule type': 'Operating Hours' },
          fieldChanges: { 'start time': ['09:00:00', '10:00:00'] },
        })}
      />,
    );

    expect(
      screen.getByText('Day: Every day \u00b7 Schedule type: Operating Hours'),
    ).not.toBeNull();
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

  it('renders rich-text field changes as text, not markup', () => {
    render(
      <AuditEventRow
        event={makeEvent({
          fieldChanges: {
            description: [
              '<p>Old <b>copy</b></p>',
              '<p>New &amp; improved</p>',
            ],
          },
        })}
      />,
    );

    expect(screen.getByText('Old copy')).not.toBeNull();
    expect(screen.getByText('New & improved')).not.toBeNull();
    expect(screen.queryByText(/<p>/)).toBeNull();
  });

  it('keeps the full value in the title while truncating the display', () => {
    const fullValue = 'a'.repeat(200);

    render(
      <AuditEventRow
        event={makeEvent({
          fieldChanges: { description: ['', `<p>${fullValue}</p>`] },
        })}
      />,
    );

    const truncated = screen.getByTitle(fullValue);

    expect(truncated.textContent?.endsWith('\u2026')).toBe(true);
    expect(truncated.textContent?.length).toBeLessThan(fullValue.length);
  });
});
