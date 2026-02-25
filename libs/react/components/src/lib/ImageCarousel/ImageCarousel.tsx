import { mergeCss } from '@monorepo/react/shared';
import useEmblaCarousel from 'embla-carousel-react';
import { useEffect, useState } from 'react';
import { ImageSlide } from './ImageSlide';
import { SlideCounter } from './SlideCounter';

export type TProps = {
  imageUrls: string[];
  className?: string;
  imageClassName?: string;
};

export function ImageCarousel(props: TProps) {
  const { imageUrls, className, imageClassName } = props;

  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [emblaRef, emblaApi] = useEmblaCarousel();

  useEffect(() => {
    if (!emblaApi) {
      return;
    }

    emblaApi.reInit();
  }, [emblaApi, imageUrls]);

  useEffect(() => {
    if (!emblaApi) {
      return;
    }

    const onSelect = () => {
      setCurrentSlideIndex(emblaApi.selectedScrollSnap());
    };

    emblaApi.on('select', onSelect);

    onSelect();

    return () => {
      emblaApi.off('select', onSelect);
    };
  }, [emblaApi]);

  const parentCss = ['overflow-hidden', 'relative', className];
  const slideContainerCss = ['flex', 'touch-pan-x', '[touch-action:pan-x]'];

  return (
    <div
      ref={emblaRef}
      className={mergeCss(parentCss)}
      aria-roledescription="carousel"
    >
      <div className={mergeCss(slideContainerCss)}>
        {imageUrls.map((src, i) => (
          <ImageSlide key={i} imageSrc={src} imgClassName={imageClassName} />
        ))}
      </div>

      <SlideCounter total={imageUrls.length} current={currentSlideIndex + 1} />
    </div>
  );
}
