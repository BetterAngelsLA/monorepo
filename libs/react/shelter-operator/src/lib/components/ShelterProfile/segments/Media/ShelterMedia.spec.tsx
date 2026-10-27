import { fireEvent, render, screen } from '@testing-library/react';
import { ShelterMedia } from './ShelterMedia';

const mocks = vi.hoisted(() => ({
  shelter: undefined as unknown,
}));

vi.mock('../../../../hooks', () => ({
  useShelterOperatorProfile: () => ({ shelter: mocks.shelter }),
}));

// The photo grid is a separate concern; these cases are about the tab shell and
// what it hands down to the grid.
vi.mock('./Photos/ShelterPhotos', () => ({
  ShelterPhotos: ({
    shelterId,
    photos,
    heroImageId,
  }: {
    shelterId: string;
    photos: { id: string }[];
    heroImageId?: string;
  }) => (
    <div
      data-testid="shelter-photos"
      data-shelter-id={shelterId}
      data-photo-ids={photos.map((photo) => photo.id).join()}
      data-hero-image-id={heroImageId ?? 'none'}
    />
  ),
}));

const shelterPhotos = () => screen.getByTestId('shelter-photos');

// Same reasoning as the photo grid: assert what the tab shell hands down.
vi.mock('./MediaLinks/ShelterMediaLinks', () => ({
  ShelterMediaLinks: ({
    shelterId,
    mediaLinks,
  }: {
    shelterId: string;
    mediaLinks: { id: string }[] | null;
  }) => (
    <div
      data-testid="shelter-media-links"
      data-shelter-id={shelterId}
      data-media-link-ids={(mediaLinks ?? []).map((link) => link.id).join()}
    />
  ),
}));

const shelterMediaLinks = () => screen.getByTestId('shelter-media-links');

function openMediaLinksTab() {
  fireEvent.click(screen.getByRole('tab', { name: 'Media Links' }));
}
describe('ShelterMedia', () => {
  afterEach(() => {
    mocks.shelter = undefined;
  });

  it('renders nothing while the shelter is loading', () => {
    const { container } = render(<ShelterMedia shelterId="shelter-1" />);

    expect(container.innerHTML).toBe('');
  });

  it('renders the section header and the photos tab', () => {
    mocks.shelter = { photos: [], heroImage: undefined };

    render(<ShelterMedia shelterId="shelter-1" />);

    expect(screen.getByText('Shelter Media')).toBeTruthy();
    expect(screen.getByRole('tab', { name: 'Photos' })).toBeTruthy();
    expect(
      screen.getByRole('tab', { name: 'Photos' }).getAttribute('aria-selected'),
    ).toBe('true');
  });

  it('passes the shelter id, photos and hero image to the photo grid', () => {
    mocks.shelter = {
      photos: [{ id: 'photo-1' }, { id: 'photo-2' }],
      heroImage: { id: 'photo-2' },
    };

    render(<ShelterMedia shelterId="shelter-1" />);

    expect(shelterPhotos().getAttribute('data-shelter-id')).toBe('shelter-1');
    expect(shelterPhotos().getAttribute('data-photo-ids')).toBe(
      'photo-1,photo-2',
    );
    expect(shelterPhotos().getAttribute('data-hero-image-id')).toBe('photo-2');
  });

  it('falls back to an empty photo list and no hero image', () => {
    mocks.shelter = { photos: null, heroImage: undefined };

    render(<ShelterMedia shelterId="shelter-1" />);

    expect(shelterPhotos().getAttribute('data-photo-ids')).toBe('');
    expect(shelterPhotos().getAttribute('data-hero-image-id')).toBe('none');
  });

  it('passes the shelter id and media links to the media links tab', () => {
    mocks.shelter = {
      photos: [],
      heroImage: undefined,
      mediaLinks: [{ id: 'media-link-1' }, { id: 'media-link-2' }],
    };

    render(<ShelterMedia shelterId="shelter-1" />);
    openMediaLinksTab();

    expect(shelterMediaLinks().getAttribute('data-shelter-id')).toBe(
      'shelter-1',
    );
    expect(shelterMediaLinks().getAttribute('data-media-link-ids')).toBe(
      'media-link-1,media-link-2',
    );
  });

  it('falls back to an empty media link list', () => {
    mocks.shelter = { photos: [], heroImage: undefined, mediaLinks: null };

    render(<ShelterMedia shelterId="shelter-1" />);
    openMediaLinksTab();

    expect(shelterMediaLinks().getAttribute('data-media-link-ids')).toBe('');
  });
});
