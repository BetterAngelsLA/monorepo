import { Link } from 'react-router-dom';

export default function OperatorPortal() {
  return (
    <div>
      <h1>Shelter Operator Portal</h1>
      <p>Submit and manage shelters across Better Angels programs.</p>
      <Link to="/operator/login">
        <button>Login</button>
      </Link>
    </div>
  );
}
