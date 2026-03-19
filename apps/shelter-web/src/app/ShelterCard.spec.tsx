/**
 * Regression test: long unbroken shelter names blew out the card layout
 * on production — the flex body expanded unbounded, the image wrapper
 * shrank, and all text disappeared.
 *
 * The fix requires three things working together:
 *  1. `overflow-hidden` on the flex body so it can't expand past its parent.
 *  2. `break-all` on the name so unbreakable strings wrap.
 *  3. `overflow-hidden` + `min-w-0` on the text wrapper so flex doesn't
 *     let the text child push past the container.
 *
 * If any one of these is removed, the card blows out again.
 */
import { ShelterCard, TShelter } from '@monorepo/react/shelter';
import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => jest.fn(),
}));
jest.mock('@vis.gl/react-google-maps', () => ({ useMap: () => null }));
jest.mock(
  '@monorepo/react/icons',
  () =>
    new Proxy(
      {},
      {
        get: (_t, p) =>
          p === '__esModule'
            ? true
            : (props: Record<string, unknown>) => <span {...props} />,
      }
    )
);

const LONG_NAME = 'AbcdefghijNoSpacesHere'.repeat(20); // ~440 chars, no breaks

const shelter: TShelter = {
  id: '1',
  name: LONG_NAME,
  heroImage: null,
  distanceInMiles: null,
  location: null,
  exteriorPhotos: [],
  interiorPhotos: [],
};

describe('ShelterCard – long-name overflow regression', () => {
  it('contains the three CSS safeguards that prevent layout blowout', () => {
    const { container } = render(<ShelterCard shelter={shelter} />);

    // 1. The flex body must clip overflow so long text can't expand it.
    const flexBody = container.querySelector('.overflow-hidden');
    expect(flexBody).toBeInTheDocument();

    // 2. The shelter name must force-break unbreakable strings.
    const nameEl = screen.getByText(LONG_NAME);
    expect(nameEl.className).toContain('break-all');

    // 3. The text content wrapper must constrain its min intrinsic width.
    expect(nameEl.parentElement?.className).toContain('min-w-0');
    expect(nameEl.parentElement?.className).toContain('overflow-hidden');
  });
});
