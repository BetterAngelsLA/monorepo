import { useQuery } from '@apollo/client';
import { GET_SHELTERS_QUERY } from '../clients/apollo/queries/getShelters.query';
import { TCoordinates } from './currentLocation';
import { ShelterList } from './shelterList';

type TSheltersByLocation = {
  className?: string;
  coordinates: TCoordinates | null;
};

export function SheltersByLocation(props: TSheltersByLocation) {
  const { coordinates, className = '' } = props;

  const { loading, error, data } = useQuery(GET_SHELTERS_QUERY);

  if (!coordinates) {
    return null;
  }

  if (loading) return <p>Loading...</p>;

  const shelters = data?.shelters?.results;

  return (
    <div className={className}>
      {!!shelters && <ShelterList className="" shelters={shelters} />}
    </div>
  );
}
