import { ImagePlaceholder } from '@monorepo/react/shelter';
import { mergeCss } from '../../utils/styles/mergeCss';

type TShelterCard = {
  className?: string;
  shelterName: string;
  imageUrl?: string | null;
};

export function ShelterCardHero(props: TShelterCard) {
  const { imageUrl, shelterName, className } = props;

  const imageCss = ['aspect-[4/3] rounded-[20px]'];
  const placeholderCss = ['border border-neutral-90', imageCss, className];

  if (!imageUrl) {
    return <ImagePlaceholder className={mergeCss(placeholderCss)} />;
  }

  return (
    <div className={mergeCss(className)}>
      <img
        src={imageUrl}
        alt={`hero image for ${shelterName} shelter`}
        loading="lazy"
        className={mergeCss(imageCss)}
      />
    </div>
  );
}
