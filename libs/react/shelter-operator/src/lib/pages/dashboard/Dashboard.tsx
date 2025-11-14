export default function Dashboard() {
  return (
    <div>
      <div>Welcome to the Operator Dashboard</div>

      <Link to="/operator/dashboard/create">
        <button>Add Shelter</button>
      </Link>
    </div>
  );
}
