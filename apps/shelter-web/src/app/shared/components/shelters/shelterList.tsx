import { useNavigate } from 'react-router-dom';
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

  const navigate = useNavigate();

  if (!shelters.length) {
    return null;
  }

  const borderCss = ['border-b', 'border-neutral-90', '-mx-4', 'mt-6'];

  const onCardClick = (shelter: TShelter) => {
    const { location } = shelter;

    sessionStorage.setItem(
      'mapCenter',
      JSON.stringify({
        lat: location?.latitude,
        lng: location?.longitude,
      })
    );

    navigate(`/shelter/${shelter.id}`);
  };

  return (
    <div className={className}>
      {shelters.map((shelter, index) => {
        return (
          <div key={index} className="mb-6 last:mb-0">
            <ShelterCard
              key={index}
              shelter={shelter}
              originCoordinates={originCoordinates}
              onClick={() => onCardClick(shelter)}
            />
            <div className={mergeCss(borderCss)}></div>
          </div>
        );
      })}
    </div>
  );
}
