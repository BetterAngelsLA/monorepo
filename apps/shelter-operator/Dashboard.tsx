import { Link } from 'react-router-dom';
import { ShelterCard, TShelter } from './ShelterCard';

type TShelterList = {
  className?: string;
  shelters: TShelter[];
};
export default function Dashboard(props: TShelterList) {
  const { shelters, className = '' } = props;

  if (!shelters.length) {
    return null;
  }

  return (
    <div>
      <Link to="/operator">
        <button>Back</button>
      </Link>
      <div>Welcome to the Operator Dashboard</div>
      <div className={className}>
        {shelters.map((shelter, index) => {
          return (
            <div key={index} className="mb-6 last:mb-0">
              <ShelterCard key={index} shelter={shelter} />

            </div>
          );
        })}
      </div>
    </div>
  );
}
