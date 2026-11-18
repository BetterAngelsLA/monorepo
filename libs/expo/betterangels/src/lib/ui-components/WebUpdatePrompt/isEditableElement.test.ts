import { isEditableElement } from './useHasFocusedEditor';

/** Minimal stand-ins: jsdom is not part of this project's test environment. */
const element = (tagName: string, isContentEditable = false) =>
  ({ tagName, isContentEditable }) as unknown as Element;

describe('isEditableElement', () => {
  it('treats form fields as editing', () => {
    expect(isEditableElement(element('INPUT'))).toBe(true);
    expect(isEditableElement(element('TEXTAREA'))).toBe(true);
    expect(isEditableElement(element('SELECT'))).toBe(true);
  });

  it('treats contenteditable as editing', () => {
    expect(isEditableElement(element('DIV', true))).toBe(true);
  });

  it('does not treat ordinary elements as editing', () => {
    expect(isEditableElement(element('DIV'))).toBe(false);
    expect(isEditableElement(element('BUTTON'))).toBe(false);
  });

  it('treats a missing active element as not editing', () => {
    // `document.activeElement` is null in some embedded webviews and on a
    // blurred document; deferring the prompt forever would be a silent outage.
    expect(isEditableElement(null)).toBe(false);
  });
});
