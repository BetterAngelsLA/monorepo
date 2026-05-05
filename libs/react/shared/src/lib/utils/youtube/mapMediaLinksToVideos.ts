import { extractYouTubeVideoId } from './extractYouTubeVideoId';

type MediaLink = {
  url: string;
  title: string;
};

type YouTubeVideo = {
  videoId: string;
  title?: string;
};

export function mapMediaLinksToVideos(mediaLinks: MediaLink[]): YouTubeVideo[] {
  return mediaLinks
    .map((link) => {
      const videoId = extractYouTubeVideoId(link.url);
      return videoId ? { videoId, title: link.title || undefined } : null;
    })
    .filter((v): v is NonNullable<typeof v> => v !== null);
}
