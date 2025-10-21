import { Link } from 'react-router-dom';
export default function Login() {
  return (
    <div>
      <Link to="/operator/dashboard">
        <button>Verify</button>
      </Link>
    </div>
  );
}
