import { Link } from 'react-router-dom';
export default function OperatorPortal() {
  return (
    <div>
      <Link to="/operator/login">
        <button>Login</button>
      </Link>
    </div>
  );
}
