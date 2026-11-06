import { describe, expect, it } from 'vitest';

import { buildNotePayload } from './transforms';
import type { TNoteFormInputs } from './schema';

function formWithTasks(tasks: TNoteFormInputs['tasks']): TNoteFormInputs {
  return { tasks } as TNoteFormInputs;
}

const persisted = {
  id: '42',
  summary: 'existing task',
  description: 'details',
  status: 'TO_DO',
  teamId: null,
  assigneeId: '7',
} as unknown as TNoteFormInputs['tasks'][number];

const localDraft = {
  id: 'temp-1700000000000',
  summary: 'new task',
  description: null,
  status: 'TO_DO',
  teamId: null,
  assigneeId: null,
} as unknown as TNoteFormInputs['tasks'][number];

describe('buildNotePayload — nested tasks', () => {
  it('sends a persisted id so the backend can diff in place', () => {
    const payload = buildNotePayload(formWithTasks([persisted]), true, { tasks: true });

    expect(payload.tasks?.[0].id).toBe('42');
  });

  it('strips the local draft id — the backend refuses an id that is not on the note', () => {
    const payload = buildNotePayload(formWithTasks([localDraft]), true, { tasks: true });

    expect(payload.tasks?.[0].id).toBeUndefined();
  });

  it('sends null for a cleared assignee so the column is cleared, not left alone', () => {
    const cleared = { ...persisted, assigneeId: null } as TNoteFormInputs['tasks'][number];

    const payload = buildNotePayload(formWithTasks([cleared]), true, { tasks: true });

    expect(payload.tasks?.[0].assigneeId).toBeNull();
  });

  it('sends an empty string for a cleared description so the text is cleared', () => {
    const cleared = {
      ...persisted,
      description: '',
    } as TNoteFormInputs['tasks'][number];

    const payload = buildNotePayload(formWithTasks([cleared]), true, { tasks: true });

    expect(payload.tasks?.[0].description).toBe('');
  });
});
