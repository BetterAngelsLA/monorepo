import { render } from '@testing-library/react-native';
import type { ReactNode } from 'react';
import { Text } from 'react-native';
import { FieldCard, renderActionName } from './FieldCard';

/**
 * `actionName` is typed `ReactNode`, so a caller may pass a plain string — and a
 * string is a text node, which a `View` may not contain (native throws, and
 * react-native-web logs "Unexpected text node"). Four call sites passed exactly
 * that, on a header `<View>` that had no other child.
 */
// `no-empty-function` is an error in this repo, so the stub has a body.
const noop = () => undefined;

const fieldCard = (actionName: ReactNode) =>
  render(
    <FieldCard
      title="Follow-Up Tasks"
      actionName={actionName}
      setExpanded={noop}
    >
      <></>
    </FieldCard>,
  );

describe('FieldCard actionName', () => {
  it('renders a plain string as text, not as a bare child of the header View', async () => {
    const { getByText } = await fieldCard('Add Title');

    // `getByText` only matches a Text, so finding it proves the wrapper is there.
    // This fails if `renderActionName` hands the string back untouched.
    expect(getByText('Add Title')).toBeTruthy();
  });

  it('passes an element through unwrapped', async () => {
    const { getByText } = await fieldCard(<Text>Add Program</Text>);

    expect(getByText('Add Program')).toBeTruthy();
  });
});

describe('renderActionName', () => {
  it('turns an empty string into nothing', () => {
    // Asserted directly rather than through a tree: an empty string is a valid
    // React child but produces no native symptom, so a rendered tree cannot tell
    // the two apart — the difference only shows up in react-native-web.
    expect(renderActionName('')).toBeNull();
  });

  it('wraps a non-empty string in Text', () => {
    expect(renderActionName('Add Title')).not.toBe('Add Title');
  });

  it('leaves an element alone', () => {
    const element = <Text>Add Program</Text>;

    expect(renderActionName(element)).toBe(element);
  });
});
