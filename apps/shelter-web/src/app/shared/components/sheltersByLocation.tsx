import { gql, useQuery } from '@apollo/client';
import { TCoordinates } from './currentLocation';
import { TShelter } from './shelterCard';
import { ShelterList } from './shelterList';

const fakeList: TShelter[] = [
  {
    name: 'shelter one',
    address: '111 main st, los angeles, ca 90011',
    heroUrl: null,
    distance: null,
  },
  {
    name: 'shelter two',
    address: '222 main st, los angeles, ca 90011',
    heroUrl: null,
    distance: null,
  },
  {
    name: 'shelter three',
    address: '333 main st, los angeles, ca 90011',
    heroUrl: null,
    distance: null,
  },
];

export const GET_SHELTERS_BY_COORDINATES = gql`
  query GetCurrentUser {
    currentUser {
      email
      username
    }
  }
`;

type TSheltersByLocation = {
  className?: string;
  coordinates: TCoordinates | null;
};

export function SheltersByLocation(props: TSheltersByLocation) {
  const { coordinates, className = '' } = props;

  const { loading, error, data } = useQuery(GET_SHELTERS_BY_COORDINATES);

  if (!coordinates) {
    return null;
  }

  if (loading) return <p>Loading...</p>;

  return (
    <div className={className}>
      {!!error && <ShelterList className="" shelters={fakeList} />}
    </div>
  );
}
