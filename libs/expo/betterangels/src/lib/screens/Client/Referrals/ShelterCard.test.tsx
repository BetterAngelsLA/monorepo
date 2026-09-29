/**
 * FE-06-pick / FE-16-pick — the shelter block rendered in both the picker and
 * the referral card.
 *
 * Tier 2 (component). Complements the pure-logic tests in matchTags.test.ts:
 * those prove the colour *rule*, this proves the rule reaches the screen.
 *
 * RVTM §7 Tier 2.
 */
import '@testing-library/react-native/build/matchers/extend-expect';
import { Colors } from '@monorepo/expo/shared/static';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { ShelterCard } from './ShelterCard';

// The shared barrels re-export every native-backed component (maps, PDF,
// pickers), so importing even TextBold loads chains whose native halves don't
// exist under test. Stubbing the two barrels keeps this file focused on the
// referral card's own markup — which is what the assertions below inspect.
// `@monorepo/expo/shared/static` is deliberately NOT stubbed: the colour
// constants are the thing being asserted.
vi.mock('@monorepo/expo/shared/ui-components', () => ({
  TextBold: ({ children }: { children: ReactNode }) => <Text>{children}</Text>,
  TextRegular: ({ children }: { children: ReactNode }) => (
    <Text>{children}</Text>
  ),
}));

vi.mock('@monorepo/expo/shared/icons', () => ({
  ExternalLinkOutlinedIcon: () => <View />,
}));

vi.mock('expo-web-browser', () => ({ openBrowserAsync: vi.fn() }));

// react-test-renderer ships no type declarations, so take the node type from
// the query itself rather than adding a dependency for one annotation.
type TestNode = ReturnType<typeof screen.getByText>;

type BadgeStyle = {
  backgroundColor?: string;
  borderColor?: string;
  borderWidth?: number;
};

/**
 * The tag styling lives on the badge <View> wrapping the label, so walk up from
 * the text to it. (`.parent` alone returns a composite element, which style
 * matchers reject, hence the host-element check.)
 *
 * Anchor on borderWidth rather than backgroundColor: an outline badge has no
 * fill, so a backgroundColor search would sail past it to an ancestor.
 */
function tagBadgeStyle(label: string): BadgeStyle | undefined {
  let node: TestNode | null = screen.getByText(label);

  while (node) {
    // host elements have a string type ('View', 'Text'); composites don't
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

const tagFillOf = (label: string) => tagBadgeStyle(label)?.backgroundColor;
const tagBorderOf = (label: string) => tagBadgeStyle(label)?.borderColor;

describe('ShelterCard', () => {
  it('renders the shelter name and location', () => {
    render(
      <ShelterCard
        id="s-1"
        name="Jackson Foundation Haven"
        place="1946 Venice Blvd"
      />,
    );

    expect(screen.getByText('Jackson Foundation Haven')).toBeOnTheScreen();
    expect(screen.getByText('1946 Venice Blvd')).toBeOnTheScreen();
  });

  it('omits the location line when the shelter has no place', () => {
    render(<ShelterCard id="s-1" name="Jackson Foundation Haven" />);

    expect(screen.getByText('Jackson Foundation Haven')).toBeOnTheScreen();
    expect(screen.queryByText('1946 Venice Blvd')).not.toBeOnTheScreen();
  });

  it('always offers the shelter directory link', () => {
    render(<ShelterCard id="s-1" name="Jackson Foundation Haven" />);

    expect(screen.getByText('View in Shelter Directory')).toBeOnTheScreen();
  });

  it('renders each attribute as a tag', () => {
    render(
      <ShelterCard
        id="s-1"
        name="Jackson Foundation Haven"
        attributes={['Cats', 'Pet Area']}
      />,
    );

    expect(screen.getByText('Cats')).toBeOnTheScreen();
    expect(screen.getByText('Pet Area')).toBeOnTheScreen();
  });

  it('surfaces a needed-but-unavailable attribute the shelter never listed', () => {
    // The red tag is the user-visible payoff of matchTags: it appears even
    // though the shelter itself never reported that attribute.
    render(
      <ShelterCard
        id="s-1"
        name="Jackson Foundation Haven"
        attributes={['Cats']}
        desiredAttributes={['Cats', 'Wheelchair Accessible']}
      />,
    );

    expect(screen.getByText('Wheelchair Accessible')).toBeOnTheScreen();
  });

  it('colours matched needs green and unmet needs red', () => {
    // both needs are pets, the category this shelter reported, so the unmet one
    // is a confirmed gap and gets a red fill
    render(
      <ShelterCard
        id="s-1"
        name="Jackson Foundation Haven"
        attributes={['Cats']}
        desiredAttributes={['Cats', 'Service Animals']}
      />,
    );

    expect(tagFillOf('Cats')).toBe(Colors.SUCCESS);
    expect(tagFillOf('Service Animals')).toBe(Colors.ERROR);
  });

  it('renders no tags when the shelter has no attributes', () => {
    render(<ShelterCard id="s-1" name="Jackson Foundation Haven" />);

    expect(screen.queryByText('Cats')).not.toBeOnTheScreen();
  });

  describe('unreported attributes', () => {
    // GAP-23: most records in the shelter DB carry no attributes at all, so a
    // card must distinguish "we don't know" from "doesn't match".
    it('says so explicitly when the shelter reported no attributes', () => {
      render(<ShelterCard id="s-1" name="Jackson Foundation Haven" />);

      expect(
        screen.getByText('No attributes reported for this shelter'),
      ).toBeOnTheScreen();
    });

    it('still lists the client needs, with a legend for the outlines', () => {
      render(
        <ShelterCard
          id="s-1"
          name="Jackson Foundation Haven"
          desiredAttributes={['Cats', 'Wheelchair Accessible']}
        />,
      );

      expect(screen.getByText('Cats')).toBeOnTheScreen();
      expect(screen.getByText('Wheelchair Accessible')).toBeOnTheScreen();
      expect(
        screen.getByText('Outlined needs were not reported by this shelter'),
      ).toBeOnTheScreen();
    });

    it('draws unconfirmed needs as red outlines, not red fills', () => {
      // The distinction is the whole point: a filled red tag asserts a
      // confirmed mismatch, which unreported data cannot support.
      render(
        <ShelterCard
          id="s-1"
          name="Jackson Foundation Haven"
          desiredAttributes={['Wheelchair Accessible']}
        />,
      );

      expect(tagFillOf('Wheelchair Accessible')).toBeUndefined();
      expect(tagBorderOf('Wheelchair Accessible')).toBe(Colors.ERROR);
    });

    it('fills the tag only when the need’s own category was reported', () => {
      // pets reported, accessibility not: the pet gap is confirmed and filled,
      // the accessibility need stays an unconfirmed outline on the same card
      render(
        <ShelterCard
          id="s-1"
          name="Jackson Foundation Haven"
          attributes={['Cats']}
          desiredAttributes={['Service Animals', 'Wheelchair Accessible']}
        />,
      );

      expect(tagFillOf('Service Animals')).toBe(Colors.ERROR);
      expect(tagFillOf('Wheelchair Accessible')).toBeUndefined();
      expect(tagBorderOf('Wheelchair Accessible')).toBe(Colors.ERROR);
      expect(
        screen.getByText('Outlined needs were not reported by this shelter'),
      ).toBeOnTheScreen();
    });

    it('drops the notice when every need had its category reported', () => {
      render(
        <ShelterCard
          id="s-1"
          name="Jackson Foundation Haven"
          attributes={['Cats']}
          desiredAttributes={['Service Animals']}
        />,
      );

      expect(
        screen.queryByText('Outlined needs were not reported by this shelter'),
      ).not.toBeOnTheScreen();
      expect(
        screen.queryByText('No attributes reported for this shelter'),
      ).not.toBeOnTheScreen();
    });
  });

  describe('collapsing attributes with no stated need', () => {
    const NEEDS = ['Cats', 'Wheelchair Accessible'];
    const OFFERED = ['Cats', 'Pet Area', 'Single Women', 'ADA Rooms'];

    it('shows every need and hides the rest by default', () => {
      render(
        <ShelterCard
          id="s-1"
          name="Jackson Foundation Haven"
          attributes={OFFERED}
          desiredAttributes={NEEDS}
        />,
      );

      // matched need + unmet need — both always visible
      expect(screen.getByText('Cats')).toBeOnTheScreen();
      expect(screen.getByText('Wheelchair Accessible')).toBeOnTheScreen();
      // offered, but nobody asked
      expect(screen.queryByText('Pet Area')).not.toBeOnTheScreen();
      expect(screen.queryByText('Single Women')).not.toBeOnTheScreen();
      expect(screen.queryByText('ADA Rooms')).not.toBeOnTheScreen();
    });

    it('counts the hidden attributes in the toggle', () => {
      render(
        <ShelterCard
          id="s-1"
          name="Jackson Foundation Haven"
          attributes={OFFERED}
          desiredAttributes={NEEDS}
        />,
      );

      expect(screen.getByText('+3 more attributes')).toBeOnTheScreen();
    });

    it('singularises the count for one hidden attribute', () => {
      render(
        <ShelterCard
          id="s-1"
          name="Jackson Foundation Haven"
          attributes={['Cats', 'Pet Area']}
          desiredAttributes={['Cats']}
        />,
      );

      expect(screen.getByText('+1 more attribute')).toBeOnTheScreen();
    });

    it('reveals the hidden attributes when expanded, and re-hides them', () => {
      render(
        <ShelterCard
          id="s-1"
          name="Jackson Foundation Haven"
          attributes={OFFERED}
          desiredAttributes={NEEDS}
        />,
      );

      fireEvent.press(screen.getByTestId('shelter-other-attributes-toggle'));

      expect(screen.getByText('Pet Area')).toBeOnTheScreen();
      expect(screen.getByText('ADA Rooms')).toBeOnTheScreen();
      expect(screen.getByText('Show fewer attributes')).toBeOnTheScreen();

      fireEvent.press(screen.getByTestId('shelter-other-attributes-toggle'));

      expect(screen.queryByText('Pet Area')).not.toBeOnTheScreen();
      expect(screen.getByText('+3 more attributes')).toBeOnTheScreen();
    });

    it('offers no toggle when every reported attribute is a stated need', () => {
      render(
        <ShelterCard
          id="s-1"
          name="Jackson Foundation Haven"
          attributes={['Cats']}
          desiredAttributes={['Cats']}
        />,
      );

      expect(
        screen.queryByTestId('shelter-other-attributes-toggle'),
      ).not.toBeOnTheScreen();
    });

    it('does not cap the needs shown, however many there are', () => {
      // The tag count tracks the need set the user chose; truncating it would
      // hide the consequence of over-selecting.
      const many = Array.from({ length: 20 }, (_, i) => `Need ${i + 1}`);
      render(
        <ShelterCard
          id="s-1"
          name="Jackson Foundation Haven"
          attributes={['Need 1']}
          desiredAttributes={many}
        />,
      );

      many.forEach((need) => expect(screen.getByText(need)).toBeOnTheScreen());
    });

    it('shows all attributes uncollapsed when there are no client needs', () => {
      // No needs means nothing to compare against, so collapsing would empty
      // the row. Callers without client context rely on this.
      render(
        <ShelterCard
          id="s-1"
          name="Jackson Foundation Haven"
          attributes={['Cats', 'Pet Area']}
        />,
      );

      expect(screen.getByText('Cats')).toBeOnTheScreen();
      expect(screen.getByText('Pet Area')).toBeOnTheScreen();
      expect(
        screen.queryByTestId('shelter-other-attributes-toggle'),
      ).not.toBeOnTheScreen();
    });
  });
});
