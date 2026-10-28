import { MediaLinkTypeChoices } from '@monorepo/ba-platform/types';
import { formSchema } from './formSchema';

const YOUTUBE_URL = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';

function parse(overrides: Partial<Record<string, string>> = {}) {
  return formSchema.safeParse({
    mediaType: MediaLinkTypeChoices.Youtube,
    url: YOUTUBE_URL,
    title: '',
    ...overrides,
  });
}

describe('media link formSchema', () => {
  it('accepts a YouTube watch URL', () => {
    expect(parse().success).toBe(true);
  });

  it.each([
    'https://youtu.be/dQw4w9WgXcQ',
    'https://youtu.be/dQw4w9WgXcQ?t=10',
    'https://www.youtube.com/embed/dQw4w9WgXcQ',
    'https://www.youtube.com/shorts/dQw4w9WgXcQ',
    'https://music.youtube.com/watch?v=dQw4w9WgXcQ',
  ])('accepts "%s"', (url) => {
    expect(parse({ url }).success).toBe(true);
  });

  it.each([
    ['', 'URL is required'],
    ['https://vimeo.com/123456789', 'Enter a valid YouTube URL.'],
    ['https://www.youtube.com/@channel', 'Enter a valid YouTube URL.'],
    ['https://youtu.be/dQw4w9WgXcQextra', 'Enter a valid YouTube URL.'],
  ])('rejects "%s"', (url, message) => {
    const result = parse({ url });

    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toBe(message);
  });

  it('rejects a title longer than 255 characters', () => {
    const result = parse({ title: 'a'.repeat(256) });

    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toBe(
      'Title must be 255 characters or fewer',
    );
  });

  it('rejects a URL longer than 255 characters', () => {
    const result = parse({ url: `${YOUTUBE_URL}&x=${'a'.repeat(255)}` });

    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toBe(
      'URL must be 255 characters or fewer',
    );
  });

  it('rejects an unknown media type', () => {
    const result = parse({ mediaType: 'VIMEO' });

    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toBe('Media type is required');
  });
});
