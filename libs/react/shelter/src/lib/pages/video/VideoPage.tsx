import { HorizontalLayout } from '../../layout';

const SHELTER_VIDEO_EMBED_URL =
  'https://drive.google.com/file/d/1K3bAbtx6UkG_J8JLLKzRqT99z-WIvjmG/preview';

export function VideoPage() {
  return (
    <HorizontalLayout>
      <div className="w-full py-6">
        <h1 className="text-2xl font-semibold mb-4">
          Shelter Directory Video Overview
        </h1>
        <div className="relative w-full" style={{ paddingTop: '56.25%' }}>
          <iframe
            className="absolute inset-0 w-full h-full rounded-lg"
            src={SHELTER_VIDEO_EMBED_URL}
            title="Shelter Directory Video Overview"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            allow="autoplay"
            allowFullScreen
          />
        </div>
      </div>
    </HorizontalLayout>
  );
}
