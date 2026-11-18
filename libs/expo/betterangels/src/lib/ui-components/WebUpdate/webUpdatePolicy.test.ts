import {
  PROMPT_AFTER_STALE_MS,
  shouldApplySilently,
  shouldPrompt,
} from './webUpdatePolicy';

const base = {
  stale: true,
  hidden: true,
  editing: false,
  guardActive: false,
};

describe('shouldApplySilently', () => {
  it('reloads unseen, when nobody is editing', () => {
    // The whole point: the update lands while the tab is in the background.
    expect(shouldApplySilently(base)).toBe(true);
  });

  it('never reloads a visible tab', () => {
    expect(shouldApplySilently({ ...base, hidden: false })).toBe(false);
  });

  it('never reloads over an unsaved note', () => {
    // A tab switch does not blur a focused field, so "hidden" alone is not
    // evidence that nobody is mid-sentence.
    expect(shouldApplySilently({ ...base, editing: true })).toBe(false);
  });

  it('does not retry a deployment it already reloaded for', () => {
    expect(shouldApplySilently({ ...base, guardActive: true })).toBe(false);
  });

  it('does nothing when the build is current', () => {
    expect(shouldApplySilently({ ...base, stale: false })).toBe(false);
  });
});

describe('shouldPrompt', () => {
  const promptBase = {
    ...base,
    hidden: false,
    promptDue: true,
    dismissed: false,
  };

  it('asks only when a visible tab has been stale long enough', () => {
    expect(shouldPrompt(promptBase)).toBe(true);
  });

  it('stays quiet before the wait is over', () => {
    expect(shouldPrompt({ ...promptBase, promptDue: false })).toBe(false);
  });

  it('stays quiet while the tab is hidden, where it updates silently', () => {
    expect(shouldPrompt({ ...promptBase, hidden: true })).toBe(false);
  });

  it('respects "not now" for this poll interval', () => {
    expect(shouldPrompt({ ...promptBase, dismissed: true })).toBe(false);
  });

  it('never interrupts someone typing', () => {
    expect(shouldPrompt({ ...promptBase, editing: true })).toBe(false);
  });
});

describe('PROMPT_AFTER_STALE_MS', () => {
  it('leaves a working day of typing before interrupting', () => {
    expect(PROMPT_AFTER_STALE_MS).toBeGreaterThanOrEqual(10 * 60 * 1000);
  });
});
