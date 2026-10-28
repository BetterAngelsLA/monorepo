import { MediaLinkTypeChoices } from '@monorepo/ba-platform/types';
import { render, screen } from '@testing-library/react';
import { MediaLinkPreview } from './MediaLinkPreview';

describe('MediaLinkPreview', () => {
  it('renders a play button for a valid YouTube link', () => {
    render(
      <MediaLinkPreview
        mediaType={MediaLinkTypeChoices.Youtube}
        url="https://youtu.be/dQw4w9WgXcQ"
        title="Shelter tour"
      />,
    );

    expect(screen.getByLabelText('Play Shelter tour')).toBeTruthy();
  });

  it('falls back to a generic accessible name when there is no title', () => {
    render(
      <MediaLinkPreview
        mediaType={MediaLinkTypeChoices.Youtube}
        url="https://youtu.be/dQw4w9WgXcQ"
        title={null}
      />,
    );

    expect(screen.getByLabelText('Play YouTube video')).toBeTruthy();
  });

  it('renders a placeholder when the URL is not a valid YouTube link', () => {
    render(
      <MediaLinkPreview
        mediaType={MediaLinkTypeChoices.Youtube}
        url="https://www.youtube.com/@channel"
        title="Shelter tour"
      />,
    );

    expect(screen.getByText('Invalid video URL')).toBeTruthy();
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('renders a placeholder for a media type without a preview', () => {
    render(
      <MediaLinkPreview
        mediaType={'VIMEO' as MediaLinkTypeChoices}
        url="https://vimeo.com/123456789"
        title="Shelter tour"
      />,
    );

    expect(screen.getByText('No preview')).toBeTruthy();
    expect(screen.queryByRole('button')).toBeNull();
  });
});
