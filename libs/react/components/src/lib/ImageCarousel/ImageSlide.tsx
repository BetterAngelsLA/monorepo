import { mergeCss } from '@monorepo/react/shared';

type TProps = {
  imageSrc: string;
  className?: string;
  altText?: string;
  imgClassName?: string;
  onClick?: () => void;
};

export function ImageSlide(props: TProps) {
  const {
    imageSrc,
    className,
    imgClassName,
    altText = 'carousel image',
    onClick,
  } = props;

  const parentCss = [
    'flex-none',
    'w-full',
    'h-full',
    onClick && 'cursor-pointer',
    className,
  ];

  const imageCss = ['block', 'w-full', 'h-full', 'object-cover', imgClassName];

  return (
    <div className={mergeCss(parentCss)} onClick={onClick}>
      <img
        src={imageSrc}
        className={mergeCss(imageCss)}
        loading="lazy"
        alt={altText}
      />
    </div>
  );
}
