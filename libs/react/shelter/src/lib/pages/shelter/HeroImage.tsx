import { mergeCss } from '@monorepo/react/components';
import { ImagePlaceholder } from '../../components';

type TProps = {
  imgUrl?: string | null;
  shelterName: string;
  className?: string;
};

export default function HeroImage(props: TProps) {
  const { imgUrl, shelterName, className } = props;

  const placeholderCss = ['h-[250px]', className];

  if (!imgUrl) {
    return <ImagePlaceholder className={mergeCss(placeholderCss)} />;
  }

  return (
    <div className={mergeCss(className)}>
      <img
        src={imgUrl}
        alt={`hero image for ${shelterName} shelter`}
        loading="lazy"
        className="aspect-[4/3] w-full object-cover"
      />
    </div>
  );
}
