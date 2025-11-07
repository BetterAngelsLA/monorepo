import { Link } from 'react-router-dom';
import { ShelterCard, TShelter } from './ShelterCard';

type TShelterList = {
  shelters: TShelter[];
};

export default function Dashboard({ shelters }: TShelterList) {
  return (
    <div>
      <Link to="/operator">
        <button className="mb-4">Back</button>
      </Link>

      <h1 className="text-xl font-semibold mb-6">
        Welcome to the Operator Dashboard
      </h1>

      <div>
        {shelters.map((shelter) => (
          <div key={shelter.id ?? shelter.name} className="mb-6 last:mb-0">
            <ShelterCard shelter={shelter} />
          </div>
        ))}
      </div>
    </div>
  );
}
