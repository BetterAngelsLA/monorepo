import { mergeCss } from '../../utils';

type TProps = {
  imageSrc: string;
  className?: string;
  altText?: string;
  imgClassName?: string;
};

export function ImageSlide(props: TProps) {
  const {
    imageSrc,
    className,
    imgClassName,
    altText = 'carousel image',
  } = props;

  const parentCss = ['flex-none', 'w-full', className];

  const imageCss = [
    'block',
    'w-full',
    'object-cover',
    'aspect-[4/3]',
    imgClassName,
  ];

  return (
    <div className={mergeCss(parentCss)}>
      <img
        src={imageSrc}
        className={mergeCss(imageCss)}
        loading="lazy"
        alt={altText}
      />
    </div>
  );
}
