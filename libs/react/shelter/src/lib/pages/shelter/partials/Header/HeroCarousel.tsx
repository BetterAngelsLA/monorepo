import { ImageCarousel } from '@monorepo/react/components';
import { mapMediaLinksToVideos, mergeCss } from '@monorepo/react/shared';
import { ShelterPhotoTypeChoices } from '../../../../apollo/graphql/__generated__/types';
import { ImagePlaceholder } from '../../../../components';
import { ViewShelterQuery } from '../../__generated__/shelter.generated';

type TProps = {
  shelter: ViewShelterQuery['shelter'];
  className?: string;
};

export function HeroCarousel(props: TProps) {
  const { shelter, className } = props;
  const heroImage = shelter.heroImage;
  const heroId = heroImage?.id;

  const exteriorPhotos = shelter.photos.filter(
    (p) => p.type === ShelterPhotoTypeChoices.Exterior && p.id !== heroId
  );
  const interiorPhotos = shelter.photos.filter(
    (p) => p.type === ShelterPhotoTypeChoices.Interior && p.id !== heroId
  );

  const imageUrls = [
    ...(heroImage?.url ? [heroImage.url] : []),
    ...exteriorPhotos.map((p) => p.file.url),
    ...interiorPhotos.map((p) => p.file.url),
  ].filter((u): u is string => Boolean(u));

  const youtubeVideos = mapMediaLinksToVideos(shelter.mediaLinks || []);

  const parentCss = ['bg-white', 'h-[200px]', className];
  const placeholderCss = ['h-[250px]', className];

  if (!imageUrls.length && !youtubeVideos.length) {
    return <ImagePlaceholder className={mergeCss(placeholderCss)} />;
  }

  return (
    <ImageCarousel
      imageUrls={imageUrls}
      youtubeVideos={youtubeVideos}
      className={mergeCss(parentCss)}
    />
  );
}
