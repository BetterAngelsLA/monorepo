import { extractYouTubeVideoId } from './extractYouTubeVideoId';

const VIDEO_ID = 'dQw4w9WgXcQ';

describe('extractYouTubeVideoId', () => {
  describe('valid', () => {
    it.each([
      [`https://www.youtube.com/watch?v=${VIDEO_ID}`, VIDEO_ID],
      [
        `https://www.youtube.com/watch?feature=share&v=${VIDEO_ID}&t=42`,
        VIDEO_ID,
      ],
      [`https://youtu.be/${VIDEO_ID}`, VIDEO_ID],
      [`https://youtu.be/${VIDEO_ID}?t=10`, VIDEO_ID],
      [`https://www.youtube.com/embed/${VIDEO_ID}`, VIDEO_ID],
      [`https://www.youtube.com/shorts/${VIDEO_ID}`, VIDEO_ID],
      [`https://music.youtube.com/watch?v=${VIDEO_ID}`, VIDEO_ID],
      [`youtu.be/${VIDEO_ID}`, VIDEO_ID],
      ['https://youtu.be/a-b_c-d_e-f', 'a-b_c-d_e-f'],
    ])('"%s"', (url, expected) => {
      expect(extractYouTubeVideoId(url)).toBe(expected);
    });
  });

  describe('invalid - returns null', () => {
    it.each([
      ['', 'empty'],
      ['not a url', 'no host'],
      [`https://vimeo.com/${VIDEO_ID}`, 'not YouTube'],
      [`https://www.notyoutube.com/watch?v=${VIDEO_ID}`, 'lookalike host'],
      [`https://notyoutu.be/${VIDEO_ID}`, 'lookalike host'],
      [`https://youtu.bex/${VIDEO_ID}`, 'invalid tld'],
      [`https://www.youtube.comx/watch?v=${VIDEO_ID}`, 'invalid tld'],
      ['https://www.youtube.com/@channel', 'channel page'],
      ['https://www.youtube.com/playlist?list=PL123', 'no video id'],
      ['https://www.youtube.com/watch?v=tooShort', 'id too short'],
      [`https://youtu.be/${VIDEO_ID}x`, 'id too long'],
    ])('"%s" %s', (url) => {
      expect(extractYouTubeVideoId(url)).toBeNull();
    });
  });
});
