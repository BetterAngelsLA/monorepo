import { ImageCarousel } from '@monorepo/react/components';
import { mergeCss } from '@monorepo/react/shared';
import { ImagePlaceholder } from '../../components';
import { ViewShelterQuery } from './__generated__/shelter.generated';

type TProps = {
  shelter: ViewShelterQuery['shelter'];
  className?: string;
};

export function HeroCarousel(props: TProps) {
  const { shelter, className } = props;
  const images = [
    ...(shelter.exteriorPhotos || []),
    ...(shelter.interiorPhotos || []),
  ];

  const parentCss = ['bg-white', 'h-[200px]', className];
  const placeholderCss = ['h-[250px]', className];

  if (!images.length) {
    return <ImagePlaceholder className={mergeCss(placeholderCss)} />;
  }

  const rest = images
    .map((i) => i.file?.url)
    .filter((u) => u !== shelter.heroImage);

  const imageUrls = shelter.heroImage ? [shelter.heroImage, ...rest] : rest;

  return (
    <ImageCarousel imageUrls={imageUrls} className={mergeCss(parentCss)} />
  );
}
