import { mergeCss } from '@monorepo/react/shared';
import useEmblaCarousel from 'embla-carousel-react';
import { useEffect, useState } from 'react';
import { ImageSlide } from './ImageSlide';
import { SlideCounter } from './SlideCounter';
import { YouTubeSlide } from './YouTubeSlide';

export type TYouTubeVideo = {
  videoId: string;
  title?: string;
};

export type TProps = {
  imageUrls: string[];
  youtubeVideos?: TYouTubeVideo[];
  className?: string;
  imageClassName?: string;
};

export function ImageCarousel(props: TProps) {
  const { imageUrls, youtubeVideos = [], className, imageClassName } = props;

  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [emblaRef, emblaApi] = useEmblaCarousel();

  const totalSlides = imageUrls.length + youtubeVideos.length;

  useEffect(() => {
    if (!emblaApi) {
      return;
    }

    emblaApi.reInit();
  }, [emblaApi, imageUrls, youtubeVideos]);

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
  const slideContainerCss = [
    'flex',
    'h-full',
    'touch-pan-x',
    '[touch-action:pan-x]',
  ];

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
        {youtubeVideos.map((video, i) => (
          <YouTubeSlide
            key={`yt-${i}`}
            videoId={video.videoId}
            title={video.title}
            onPrev={() => emblaApi?.scrollPrev()}
            onNext={() => emblaApi?.scrollNext()}
          />
        ))}
      </div>

      <SlideCounter total={totalSlides} current={currentSlideIndex + 1} />
    </div>
  );
}
