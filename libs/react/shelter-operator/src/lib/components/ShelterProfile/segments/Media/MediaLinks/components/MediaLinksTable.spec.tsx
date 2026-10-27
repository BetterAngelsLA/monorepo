import { MediaLinkTypeChoices } from '@monorepo/ba-platform/types';
import { render, screen } from '@testing-library/react';
import type { ShelterProfileMediaLinkType } from '../../../../types';
import { MediaLinksTable } from './MediaLinksTable';

const noop = () => {};

const mediaLink: ShelterProfileMediaLinkType = {
  __typename: 'MediaLinkType',
  id: 'media-link-1',
  url: 'https://youtu.be/dQw4w9WgXcQ',
  title: 'Shelter tour',
  mediaType: MediaLinkTypeChoices.Youtube,
};

function renderTable(
  overrides: Partial<Parameters<typeof MediaLinksTable>[0]>,
) {
  const props = {
    mediaLinks: [mediaLink],
    canEdit: true,
    disabled: false,
    onEdit: noop,
    onDelete: noop,
    ...overrides,
  };

  return render(<MediaLinksTable {...props} />);
}

describe('MediaLinksTable', () => {
  it('renders the media link title and url', () => {
    renderTable({});

    expect(screen.getByText('Shelter tour')).toBeTruthy();
    expect(screen.getByRole('link').getAttribute('href')).toBe(
      'https://youtu.be/dQw4w9WgXcQ',
    );
  });

  it('renders the empty state when there are no media links', () => {
    renderTable({ mediaLinks: [] });

    expect(screen.getByText('No media links yet.')).toBeTruthy();
  });

  it('hides the row actions when the user cannot edit', () => {
    renderTable({ canEdit: false });

    expect(screen.queryByLabelText('Edit media link')).toBeNull();
    expect(screen.queryByLabelText('Delete media link')).toBeNull();
  });

  it('shows enabled row actions when the user can edit', () => {
    renderTable({});

    expect(
      (screen.getByLabelText('Edit media link') as HTMLButtonElement).disabled,
    ).toBe(false);
    expect(
      (screen.getByLabelText('Delete media link') as HTMLButtonElement)
        .disabled,
    ).toBe(false);
  });

  it('disables the row actions while a mutation is in flight', () => {
    renderTable({ disabled: true });

    expect(
      (screen.getByLabelText('Edit media link') as HTMLButtonElement).disabled,
    ).toBe(true);
    expect(
      (screen.getByLabelText('Delete media link') as HTMLButtonElement)
        .disabled,
    ).toBe(true);
  });
});
