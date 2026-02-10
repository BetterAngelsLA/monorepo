import { Link } from 'react-router-dom';
import { useFeatureFlagActive } from '@monorepo/react/shared';
import { FeatureFlags } from '../../static/featureFlags';

export default function Dashboard() {
  const bpChangesEnabled = useFeatureFlagActive(
    FeatureFlags.BP_CHANGES_FF
  );

  return (
    <div>
      <Link to="/operator">
        <button>Back</button>
      </Link>
      <div>Welcome to the Operator Dashboard</div>

      <Link to="/operator/dashboard/create">
        <button>Add Shelter</button>
      </Link>
      {bpChangesEnabled ? (
        <div className="mt-4 rounded-md bg-blue-50 p-4 text-sm text-blue-800">
          BP feature flag is ON – BP changes are enabled.
        </div>
      ) : null}
    </div>
  );
}
