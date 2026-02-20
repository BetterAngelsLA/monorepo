import { mergeCss } from '@monorepo/react/shared';
import { TLatLng } from '@monorepo/react/components';
import { ShelterCard, TShelter } from '../shelter/shelterCard';

type TShelterList = {
  className?: string;
  shelters: TShelter[];
  originCoordinates?: TLatLng | null;
};

export function ShelterList(props: TShelterList) {
  const { shelters, originCoordinates, className = '' } = props;

  if (!shelters.length) {
    return null;
  }

  const borderCss = ['border-b', 'border-neutral-90', '-mx-4', 'mt-6'];

  return (
    <div className={className}>
      {shelters.map((shelter, index) => {
        return (
          <div key={index} className="mb-6 last:mb-0">
            <ShelterCard
              key={index}
              shelter={shelter}
              originCoordinates={originCoordinates}
            />
            <div className={mergeCss(borderCss)}></div>
          </div>
        );
      })}
    </div>
  );
}
