import { TLocationSource } from '../../atoms/locationAtom';

type TProps = {
  className?: string;
  coordinatesSource?: TLocationSource;
};

export function SearchSource(props: TProps) {
  const { coordinatesSource, className = '' } = props;

  let locationSource = 'selections';

  if (coordinatesSource === 'address') {
    locationSource = 'provided address';
  }

  if (coordinatesSource === 'currentLocation') {
    locationSource = 'current location';
  }

  return <div className={className}>(based on your {locationSource})</div>;
}
