import { Link } from 'react-router-dom';
export default function Dashboard() {
  return (
    <div>
      <Link to="/operator">
        <button>Back</button>
      </Link>
      <div>Welcome to the Operator Dashboard</div>

      <Link to="/operator/dashboard/create">
        <button>Add Shelter</button>
      </Link>
    </div>
  );
}
