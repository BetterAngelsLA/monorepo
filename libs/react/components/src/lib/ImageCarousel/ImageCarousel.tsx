import useEmblaCarousel from 'embla-carousel-react';
import { mergeCss } from '../../utils';
import { ImageSlide } from './ImageSlide';

type TProps = {
  imageUrls: string[];
  className?: string;
  imageClassName?: string;
};

export function ImageCarousel(props: TProps) {
  const { imageUrls, className, imageClassName } = props;

  const [emblaRef] = useEmblaCarousel();

  const parentCss = ['overflow-hidden', 'relative', className];
  const slideContainerCss = ['flex', 'touch-pan-x', '[touch-action:pan-x]'];

  return (
    <div ref={emblaRef} className={mergeCss(parentCss)}>
      <div className={mergeCss(slideContainerCss)}>
        {imageUrls.map((src, i) => (
          <ImageSlide key={i} imageSrc={src} imgClassName={imageClassName} />
        ))}
      </div>
    </div>
  );
}
