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

  return (
    <div className={className}>
      {shelters.map((shelter, index) => {
        return (
          <ShelterCard
            key={index}
            className="mb-8 last:mb-0"
            shelter={shelter}
            originCoordinates={originCoordinates}
          />
        );
      })}
    </div>
  );
}
