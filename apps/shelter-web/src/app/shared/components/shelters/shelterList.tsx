import { mergeCss } from '../../utils/styles/mergeCss';
import { TLatLng } from '../map/types.maps';
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

  const borderCss = ['border-b', 'border-neutral-90', '-mx-4', 'mb-4'];

  return (
    <div className={className}>
      {shelters.map((shelter, index) => {
        return (
          <>
            <ShelterCard
              key={index}
              className="mb-4 last:mb-0"
              shelter={shelter}
              originCoordinates={originCoordinates}
            />
            <div className={mergeCss(borderCss)}></div>
          </>
        );
      })}
    </div>
  );
}
