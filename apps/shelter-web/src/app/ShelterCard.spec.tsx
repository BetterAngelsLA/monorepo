/**
 * Regression test: long unbroken shelter names blew out the card layout
 * on production — the flex body expanded unbounded, the image wrapper
 * shrank, and all text disappeared.
 *
 * The fix requires two things working together:
 *  1. `overflow-hidden` on the flex body so it can't expand past its parent.
 *  2. `wrap-anywhere` on the name so the browser factors mid-word breaks
 *     into intrinsic sizing (prevents flex blowout without needing min-w-0).
 *
 * If either is removed, the card blows out again.
 */
import { ShelterCard, TShelter } from '@monorepo/react/shelter';
import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';

vi.mock('react-router-dom', async (importOriginal) => ({
  ...(await importOriginal<typeof import('react-router-dom')>()),
  useNavigate: () => vi.fn(),
}));
vi.mock('@vis.gl/react-google-maps', () => ({ useMap: () => null }));

const LONG_NAME = 'AbcdefghijNoSpacesHere'.repeat(20); // ~440 chars, no breaks

const shelter: TShelter = {
  id: '1',
  name: LONG_NAME,
  heroImage: null,
  distanceInMiles: null,
  location: null,
  photos: [],
};

describe('ShelterCard – long-name overflow regression', () => {
  it('contains the CSS safeguards that prevent layout blowout', () => {
    const { container } = render(<ShelterCard shelter={shelter} />);

    // 1. The flex body must clip overflow so long text can't expand it.
    const flexBody = container.querySelector('.overflow-hidden');
    expect(flexBody).toBeInTheDocument();

    // 2. The shelter name must use wrap-anywhere for intrinsic size constraint.
    const nameEl = screen.getByText(LONG_NAME);
    expect(nameEl.className).toContain('wrap-anywhere');

    // 3. The text content wrapper must clip overflow.
    expect(nameEl.parentElement?.className).toContain('overflow-hidden');
  });
});
