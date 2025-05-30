import { ImageCarousel, mergeCss } from '@monorepo/react/components';
import { ViewShelterQuery } from './__generated__/shelter.generated';

type TProps = {
  shelter: ViewShelterQuery['shelter'];
  className?: string;
};

export function HeroCarousel(props: TProps) {
  const { shelter, className } = props;

  const images: string[] = [];

  shelter.exteriorPhotos.forEach((i) => {
    images.push(i.file.url);
  });

  shelter.interiorPhotos.forEach((i) => {
    images.push(i.file.url);
  });

  const parentCss = ['bg-white', className];

  return <ImageCarousel imageUrls={images} className={mergeCss(parentCss)} />;
}
