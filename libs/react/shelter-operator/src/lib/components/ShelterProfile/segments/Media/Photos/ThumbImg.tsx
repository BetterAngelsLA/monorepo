import { mergeCss } from '@monorepo/react/shared';
import { useState } from 'react';
import { Modal } from '../../../../base-ui/modal';

type TProps = {
  src: string | null;
  srcLg: string | null;
  alt?: string;
  className?: string;
};

type TWrapperProps = {
  className?: string;
  children: React.ReactNode;
};

function Wrapper(props: TWrapperProps) {
  const { className, children } = props;

  return (
    <div className={mergeCss(['w-14 h-14 rounded overflow-hidden', className])}>
      {children}
    </div>
  );
}

function Placeholder() {
  return (
    <div className="w-full h-full bg-[#F3F4F6] flex items-center justify-center text-[#9CA3AF] text-xs">
      No image
    </div>
  );
}

export function ThumbImg(props: TProps) {
  const { src, srcLg, alt = '', className } = props;

  const [lightboxOpen, setLightboxOpen] = useState(false);

  return (
    <Wrapper className={mergeCss([src && 'cursor-pointer', className])}>
      {!src && <Placeholder />}

      {src && (
        <>
          <img
            src={src}
            alt={alt}
            className="w-full h-full object-cover"
            onClick={() => setLightboxOpen(true)}
          />

          {srcLg && (
            <Modal
              isOpen={lightboxOpen}
              onClose={() => setLightboxOpen(false)}
              size="full"
              showCloseButton
            >
              <div className="relative w-full h-full flex items-center justify-center p-6 bg-black/80">
                <img
                  src={srcLg}
                  alt={alt}
                  className="max-w-full max-h-full object-contain"
                />
              </div>
            </Modal>
          )}
        </>
      )}
    </Wrapper>
  );
}
