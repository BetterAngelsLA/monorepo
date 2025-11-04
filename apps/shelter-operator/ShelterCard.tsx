import { ReactNode } from 'react';

export type TShelter = {
  id: string;
  name: string;
  heroImage?: string | null;
  exteriorPhotos?: Array<{ file: { url: string; name: string } }> | null;
  interiorPhotos?: Array<{ file: { url: string; name: string } }> | null;
};

type TShelterCard = {
  className?: string;
  shelter: TShelter;
  footer?: ReactNode | null;
  footerClassName?: string;
};

export function ShelterCard(props: TShelterCard) {
  const {
    shelter: { id, name, heroImage },
    className,
    footer,
    footerClassName,
  } = props;

  return (
    <div
      key={id}
      className={`bg-white text-black rounded-2xl shadow-md p-4 hover:shadow-lg transition ${
        className ?? ''
      }`}
    >
      {heroImage && (
        <img
          src={heroImage}
          alt={name}
          className="w-full h-48 object-cover rounded-xl mb-4"
        />
      )}
      <h1 className="text-xl font-semibold">{name}</h1>

      {footer && (
        <div className={`mt-4 ${footerClassName ?? ''}`}>{footer}</div>
      )}
    </div>
  );
}
