import { Link } from 'react-router-dom';

export default function OperatorLogin() {
  return (
    <div className="space-y-4 p-6">
      <h1 className="text-2xl font-semibold text-gray-900">Operator Login</h1>
      <p className="text-sm text-gray-600">Verify your identity to access the dashboard.</p>
      <Link to="/operator/dashboard">
        <button className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
          Verify
        </button>
      </Link>
    </div>
  );
}
