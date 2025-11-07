import { Link } from 'react-router-dom';
import type { Shelter } from './ShelterCard';
import { ShelterCard } from './ShelterCard';

type TShelterList = {
  shelters?: Shelter[];
};

export const SAMPLE_SHELTERS: Shelter[] = [
  {
    id: '1',
    name: 'Hope Shelter',
    address: '123 Main St, Springfield',
    image: {
      file: {
        url: 'https://developers.elementor.com/docs/assets/img/elementor-placeholder-image.png',
        name: 'img-1',
      },
    },
    bedsAvailiable: 10,
  },
  {
    id: '2',
    name: 'Harbor House',
    address: '456 Oak Ave, River City',
    image: {
      file: {
        url: 'https://developers.elementor.com/docs/assets/img/elementor-placeholder-image.png',
        name: 'img-2',
      },
    },
    bedsAvailiable: 30,
  },
  {
    id: '3',
    name: 'Sunrise Center',
    address: '789 Pine Rd, Lakeside',
    // no image
    bedsAvailiable: 65,
  },
];

export default function Dashboard({
  shelters = SAMPLE_SHELTERS, }: TShelterList) {
  return (
    <div className="p-8">
      <Link to="/operator">
        <button className="mb-4">Back</button>
      </Link>

      <h1 className="text-xl font-semibold mb-6">
        Welcome to the Operator Dashboard
      </h1>

     <div>
        {shelters.map((shelter) => (
        <div key={shelter.id}>
          <ShelterCard shelter={shelter} />
        </div>
      ))}
    </div>
  </div>
  );
}
