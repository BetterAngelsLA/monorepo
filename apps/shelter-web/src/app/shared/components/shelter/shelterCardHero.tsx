import { ImagePlaceholder } from '@monorepo/react/shelter';
import { mergeCss } from '../../utils/styles/mergeCss';

type TShelterCard = {
  className?: string;
  shelterName: string;
  imageUrl?: string | null;
  photos?: Array<{ file: { url: string; name: string } }> | null;
};

export function ShelterCardHero(props: TShelterCard) {
  const { imageUrl, shelterName, className, photos } = props;

  const imageCss = ['w-full h-[120px] object-cover rounded-[20px]'];
  const thumbImg = [
    'inline-block align-top w-[159px] h-[120px] mr-2 last:mr-0 rounded-[20px]',
  ];
  const placeholderCss = [
    'border border-neutral-90 w-[328px] md:w-96',
    imageCss,
    className,
  ];

  const urls =
    (photos?.map((p) => p?.file?.url).filter(Boolean) as
      | string[]
      | undefined) ?? [];

  if (urls.length === 0 && imageUrl) urls.push(imageUrl);

  if (urls.length === 0) {
    return <ImagePlaceholder className={mergeCss(placeholderCss)} />;
  }

  if (urls.length === 1) {
    return (
      <div className={mergeCss(className)}>
        <img
          src={urls[0]}
          alt={`hero image for ${shelterName} shelter`}
          loading="lazy"
          className={mergeCss(imageCss)}
        />
      </div>
    );
  }

  if (urls.length === 2) {
    return (
      <div
        className={mergeCss([
          'grid grid-cols-2 gap-2 w-full min-w-0',
          className,
        ])}
      >
        {urls.slice(0, 2).map((src, i) => (
          <img
            key={i}
            src={src}
            alt={`photo ${i + 1} of ${shelterName} shelter`}
            loading="lazy"
            className={mergeCss(imageCss)}
          />
        ))}
      </div>
    );
  }

  return (
    <div className={mergeCss(['w-full min-w-0', className])}>
      <div className="overflow-hidden rounded-[20px]">
        <div
          className="w-full max-w-full min-w-0 overflow-x-auto overscroll-x-contain"
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          <div className="whitespace-nowrap">
            {urls.map((src, i) => (
              <img
                key={i}
                src={src}
                alt={`photo ${i + 1} of ${shelterName} shelter`}
                loading="lazy"
                className={mergeCss(thumbImg)}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
