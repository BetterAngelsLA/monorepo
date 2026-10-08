/**
 * The referrals help sheet — chiefly the attribute-tag legend.
 *
 * The legend is built from the same <TagRow> the shelter cards use, so these
 * tests check that each of the four states is actually *shown the way it is
 * described*. A legend that says "outlined" while rendering a fill is worse
 * than no legend.
 *
 * NOT covered here: that the sheet actually scrolls. A first cut wrapped the
 * sheet in the backdrop Pressable and blocked touch propagation with
 * `onStartShouldSetResponder`, which starved the inner ScrollView — the Close
 * button was rendered but unreachable. Every test below still passed, because
 * `fireEvent.press` finds elements by testID regardless of whether a real
 * finger could reach them. Device verification caught it; the fix was to make
 * the backdrop a sibling behind the sheet rather than its parent.
 *
 * RVTM §7 Tier 2.
 */
import '@testing-library/react-native/build/matchers/extend-expect';
import { icons, svg, uiComponents } from '../../../../__mocks__/sharedBarrels';
import { Colors } from '@monorepo/expo/shared/static';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';
import { ReferralsHelp } from './ReferralsHelp';

// See sharedBarrels.tsx: the shared barrels pull in native-backed components
// whose native halves don't exist under test. `static` stays real.
vi.mock('@monorepo/expo/shared/ui-components', () => uiComponents());
vi.mock('@monorepo/expo/shared/icons', () => icons());
vi.mock('react-native-svg', () => svg());
vi.mock('expo-web-browser', () => ({ openBrowserAsync: vi.fn() }));

type TestNode = ReturnType<typeof screen.getByText>;
type BadgeStyle = {
  backgroundColor?: string;
  borderColor?: string;
  borderWidth?: number;
};

// same anchor as ShelterCard.test.tsx: the badge is the only element carrying a
// border width, and an outline badge has no fill to search for
function tagBadgeStyle(label: string): BadgeStyle | undefined {
  let node: TestNode | null = screen.getByText(label);
  while (node) {
    if (typeof node.type === 'string') {
      const style = StyleSheet.flatten(node.props.style) as
        | BadgeStyle
        | undefined;
      if (style?.borderWidth) return style;
    }
    node = node.parent;
  }
  return undefined;
}

describe('ReferralsHelp', () => {
  const open = () => render(<ReferralsHelp visible onClose={vi.fn()} />);

  it('renders nothing until opened', () => {
    render(<ReferralsHelp visible={false} onClose={vi.fn()} />);

    expect(screen.queryByText('About this list')).not.toBeOnTheScreen();
  });

  it('explains the list when opened', () => {
    open();

    expect(screen.getByText('About this list')).toBeOnTheScreen();
    expect(screen.getByText('Shelter attribute tags')).toBeOnTheScreen();
  });

  describe('legend swatches match what they describe', () => {
    it('shows the match example as a green fill', () => {
      open();

      expect(
        tagBadgeStyle('Client Need: Provided by Shelter')?.backgroundColor,
      ).toBe(Colors.SUCCESS);
    });

    it('shows the confirmed-gap example as a red fill', () => {
      open();

      expect(
        tagBadgeStyle('Client Need: Not Provided by Shelter')?.backgroundColor,
      ).toBe(Colors.ERROR);
    });

    it('shows the unknown example as a red outline with no fill', () => {
      open();
      const style = tagBadgeStyle('Client Need: Not Reported by Shelter');

      expect(style?.backgroundColor).toBeUndefined();
      expect(style?.borderColor).toBe(Colors.ERROR);
    });

    it('shows the no-stated-need example in gray', () => {
      open();

      expect(
        tagBadgeStyle('Shelter Attribute: Not Needed by Client')
          ?.backgroundColor,
      ).toBe(Colors.NEUTRAL);
    });
  });

  it('warns that matching does not check bed availability', () => {
    // GAP-01 — the UI must not imply a bed is held
    open();

    expect(
      screen.getByText(/never checks whether a bed is actually free/),
    ).toBeOnTheScreen();
  });

  it('closes from the Close button', () => {
    const onClose = vi.fn();
    render(<ReferralsHelp visible onClose={onClose} />);

    fireEvent.press(screen.getByTestId('referrals-help-close-btn'));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('closes when the backdrop is tapped', () => {
    const onClose = vi.fn();
    render(<ReferralsHelp visible onClose={onClose} />);

    // includeHiddenElements: the sheet sets accessibilityViewIsModal, so the
    // backdrop is deliberately outside the accessibility tree — a screen-reader
    // user closes via the Close button. It stays touch-reachable for everyone
    // else, which is what this asserts.
    fireEvent.press(
      screen.getByTestId('referrals-help-backdrop', {
        includeHiddenElements: true,
      }),
    );

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('keeps Close outside the scrolling body so it cannot scroll away', () => {
    // The exit must stay put however long the help text grows. Asserting the
    // structural relationship, because "is it visible on screen" is not
    // something the renderer can answer — that part is device-verified.
    open();

    let node = screen.getByTestId('referrals-help-close-btn').parent;
    while (node) {
      expect(node.type).not.toBe('RCTScrollView');
      node = node.parent;
    }
  });

  it('keeps the sheet itself inside the accessibility tree', () => {
    // guards the inverse mistake: marking the wrong node modal would hide the
    // help content rather than the backdrop
    open();

    expect(screen.getByText('About this list')).toBeOnTheScreen();
    expect(screen.getByTestId('referrals-help-close-btn')).toBeOnTheScreen();
  });
});
