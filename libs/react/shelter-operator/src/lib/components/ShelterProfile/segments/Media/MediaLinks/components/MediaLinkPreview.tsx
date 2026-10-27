import { MediaLinkTypeChoices } from '@monorepo/ba-platform/types';
import { VideoEmbed, YouTubeThumbnail } from '@monorepo/react/components';
import { extractYouTubeVideoId, mergeCss } from '@monorepo/react/shared';
import { useState } from 'react';
import { Modal, ModalBody, ModalHeader } from '../../../../../base-ui/modal';

type TProps = {
  mediaType: MediaLinkTypeChoices;
  url: string;
  title?: string | null;
};

function PreviewPlaceholder(props: { label: string }) {
  const { label } = props;

  const parentCss = [
    'w-24',
    'aspect-video',
    'rounded',
    'overflow-hidden',
    'bg-[#F3F4F6]',
    'flex',
    'items-center',
    'justify-center',
    'p-1',
    'text-center',
    'text-xs',
    'text-[#9CA3AF]',
  ];

  return <div className={mergeCss(parentCss)}>{label}</div>;
}

export function MediaLinkPreview(props: TProps) {
  const { mediaType, url, title } = props;

  const [isOpen, setIsOpen] = useState(false);

  if (mediaType !== MediaLinkTypeChoices.Youtube) {
    return <PreviewPlaceholder label="No preview" />;
  }

  const ytVideoId = extractYouTubeVideoId(url);

  // only supports YT for now
  if (!ytVideoId) {
    return <PreviewPlaceholder label="Invalid video URL" />;
  }

  const label = title || 'YouTube video';

  function handleClose() {
    setIsOpen(false);
  }

  return (
    <>
      <YouTubeThumbnail
        videoId={ytVideoId}
        title={title ?? undefined}
        onClick={() => setIsOpen(true)}
      />

      <Modal
        isOpen={isOpen}
        onClose={handleClose}
        size="2xl"
        className="min-w-112"
      >
        <ModalHeader onClose={handleClose}>
          <div className="font-medium text-xl">{label}</div>
        </ModalHeader>
        <ModalBody className="pt-4 pb-12">
          <VideoEmbed
            src={`https://www.youtube-nocookie.com/embed/${ytVideoId}`}
            title={label}
            className="border border-gray-200 rounded"
          />
        </ModalBody>
      </Modal>
    </>
  );
}
