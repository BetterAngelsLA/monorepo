import { isActivelyEditing, isEditableElement } from './useHasFocusedEditor';

/** Minimal stand-ins: this project's test environment has no DOM. */
const element = (tagName: string, extra: Record<string, unknown> = {}) =>
  ({ tagName, isContentEditable: false, ...extra }) as unknown as Element;

describe('isEditableElement', () => {
  it('treats text entry as editing', () => {
    expect(isEditableElement(element('INPUT', { type: 'text' }))).toBe(true);
    expect(isEditableElement(element('INPUT', { type: 'email' }))).toBe(true);
    expect(isEditableElement(element('INPUT', { type: '' }))).toBe(true);
    expect(isEditableElement(element('TEXTAREA'))).toBe(true);
  });

  it('treats contenteditable as editing', () => {
    expect(
      isEditableElement(element('DIV', { isContentEditable: true })),
    ).toBe(true);
  });

  it('does not treat controls that merely hold focus as editing', () => {
    // These keep focus after use, and a modal over them interrupts nothing —
    // treating them as editing would suppress the prompt indefinitely.
    expect(isEditableElement(element('INPUT', { type: 'checkbox' }))).toBe(false);
    expect(isEditableElement(element('INPUT', { type: 'radio' }))).toBe(false);
    expect(isEditableElement(element('INPUT', { type: 'submit' }))).toBe(false);
    expect(isEditableElement(element('SELECT'))).toBe(false);
    expect(isEditableElement(element('BUTTON'))).toBe(false);
  });

  it('treats a missing active element as not editing', () => {
    expect(isEditableElement(null)).toBe(false);
  });
});

describe('isActivelyEditing', () => {
  it('defers while keystrokes are recent', () => {
    expect(isActivelyEditing(1_000, 1_000 + 5_000, 30_000)).toBe(true);
  });

  it('lapses once the user stops typing', () => {
    // The failure this prevents: a field left focused while the user walks away
    // would otherwise suppress the prompt for the whole session.
    expect(isActivelyEditing(1_000, 1_000 + 31_000, 30_000)).toBe(false);
  });

  it('does not defer when nothing editable is focused', () => {
    expect(isActivelyEditing(null, Date.now(), 30_000)).toBe(false);
  });

  it('does not defer on a backwards clock', () => {
    expect(isActivelyEditing(1_000, 500, 30_000)).toBe(false);
  });
});
