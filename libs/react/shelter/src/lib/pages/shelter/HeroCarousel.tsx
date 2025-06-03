import { ImageCarousel, mergeCss } from '@monorepo/react/components';
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

  const imageUrls = images.map((i) => i.file.url);

  const parentCss = ['bg-white', className];
  const placeholderCss = ['h-[250px]', className];

  if (!images.length) {
    return <ImagePlaceholder className={mergeCss(placeholderCss)} />;
  }

  return (
    <ImageCarousel imageUrls={imageUrls} className={mergeCss(parentCss)} />
  );
}
