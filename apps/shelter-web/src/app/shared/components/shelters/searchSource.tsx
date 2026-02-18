import { TLocationSource } from '@monorepo/react/shelter';

type TProps = {
  className?: string;
  coordinatesSource?: TLocationSource;
};

export function SearchSource(props: TProps) {
  const { coordinatesSource, className = '' } = props;

  // Keep this logic in case we need to use it later
  // let locationSource = 'selections';

  let locationSource = 'search area';

  if (coordinatesSource === 'address') {
    locationSource = 'search area';
  }

  if (coordinatesSource === 'currentLocation') {
    locationSource = 'search area';
  }

  return <div className={className}>(based on your {locationSource})</div>;
}
