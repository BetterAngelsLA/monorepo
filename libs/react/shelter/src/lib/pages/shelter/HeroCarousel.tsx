import { ImageCarousel, mergeCss } from '@monorepo/react/components';
import { ImagePlaceholder } from '../../components';
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
  const placeholderCss = ['h-[250px]', className];

  if (!images.length) {
    return <ImagePlaceholder className={mergeCss(placeholderCss)} />;
  }

  return <ImageCarousel imageUrls={images} className={mergeCss(parentCss)} />;
}
