import { AuditEventKind } from '@monorepo/ba-platform/types';
import { render, screen } from '@testing-library/react';
import type { AuditEvent } from '../../hooks';
import { AuditEventRow } from './AuditEventRow';

function makeEvent(overrides: Partial<AuditEvent>): AuditEvent {
  return {
    __typename: 'AuditEventType',
    timestamp: '2026-07-01T12:00:00Z',
    kind: AuditEventKind.Update,
    action: 'bed.update',
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

  it('labels related choice values in the event details', () => {
    render(
      <AuditEventRow
        event={makeEvent({
          fieldChanges: { Parking: [['street'], []] },
        })}
      />,
    );

    expect(screen.getByText(/Street Parking/)).not.toBeNull();
    expect(screen.queryByText(/street/)).toBeNull();
  });

  it('collapses a schedule slot into one coloured line', () => {
    render(
      <AuditEventRow
        event={makeEvent({
          action: 'shelter.schedule.add',
          kind: AuditEventKind.Insert,
          fieldChanges: {
            day: [null, 'Thursday'],
            'end time': [null, '16:00:00'],
            shelter: [null, 'Gomez Family Sanctuary (id-12)'],
            'start time': [null, '06:00:00'],
            'is exception': [null, false],
            'schedule type': [null, 'Operating Hours'],
          },
        })}
      />,
    );

    const line = screen.getByText(
      'Added Operating Hours: Thursday 06:00 - 16:00',
    );

    // Additions read green; the row no longer prints the id, the shelter name or
    // a per-column pair whose other side is always null.
    expect(line.className).toContain('text-success-30');
    expect(screen.queryByText(/Gomez/)).toBeNull();
    expect(screen.queryByText(/Schedule \d/)).toBeNull();
    expect(screen.queryByText(/\u2192/)).toBeNull();
  });

  it('falls back to the field changes for an in-place schedule update', () => {
    // No context means no identity: show the real diff rather than "Every day".
    render(
      <AuditEventRow
        event={makeEvent({
          action: 'shelter.schedule.update',
          fieldChanges: { 'start time': ['09:00:00', '10:00:00'] },
        })}
      />,
    );

    expect(screen.getByText('Start time:')).not.toBeNull();
    expect(screen.queryByText(/Every day/)).toBeNull();
    expect(screen.queryByText(/\u2192/)).not.toBeNull();
  });

  it('renders a removal in red', () => {
    render(
      <AuditEventRow
        event={makeEvent({
          action: 'shelter.schedule.remove',
          kind: AuditEventKind.Delete,
          fieldChanges: {
            day: ['Thursday', null],
            'end time': ['18:00:00', null],
            'start time': ['08:00:00', null],
            'is exception': [false, null],
            'schedule type': ['Operating Hours', null],
          },
        })}
      />,
    );

    const line = screen.getByText(
      'Removed Operating Hours: Thursday 08:00 - 18:00',
    );

    expect(line.className).toContain('text-alert-60');
  });

  it('keeps the slot identity and the arrow for a time change', () => {
    render(
      <AuditEventRow
        event={makeEvent({
          action: 'shelter.schedule.update',
          context: { day: 'Monday', 'schedule type': 'Intake Hours' },
          fieldChanges: {
            'start time': ['09:00:00', '10:00:00'],
            'end time': ['17:00:00', '18:00:00'],
          },
        })}
      />,
    );

    expect(
      screen.getByText(
        'Changed Intake Hours: Monday 09:00 - 17:00 \u2192 10:00 - 18:00',
      ),
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
