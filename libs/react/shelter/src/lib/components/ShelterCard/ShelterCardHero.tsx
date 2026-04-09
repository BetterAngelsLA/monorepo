import { mergeCss } from '@monorepo/react/shared';
import { ImagePlaceholder } from '../ImagePlaceholder';

type TShelterCard = {
  className?: string;
  shelterName: string;
  imageUrl?: string | null;
};

export function ShelterCardHero(props: TShelterCard) {
  const { imageUrl, shelterName, className } = props;

  const imageCss = ['w-full h-[120px] object-cover rounded-lg'];
  const placeholderCss = [
    'border border-neutral-90 w-[328px] md:w-96',
    imageCss,
    className,
  ];

  if (!imageUrl) {
    return <ImagePlaceholder className={mergeCss(placeholderCss)} />;
  }

  return (
    <div className={mergeCss(className)}>
      <img
        src={imageUrl}
        alt={`Primary view of ${shelterName} shelter`}
        loading="lazy"
        className={mergeCss(imageCss)}
      />
    </div>
  );
}
