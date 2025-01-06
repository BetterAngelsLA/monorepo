import { Card } from '@monorepo/react/components';
import { ViewShelterQuery } from './__generated__/shelter.generated';

export default function Restrictions({
  shelter,
}: {
  shelter: ViewShelterQuery['shelter'];
}) {
  return (
    <Card title="Restrictions">
      <div className="flex flex-col gap-2">
        {shelter.maxStay && (
          <div className="flex gap-1">Max Stay: {shelter.maxStay} days</div>
        )}
        {shelter.curfew && (
          <div className="flex gap-1">Curfew: {shelter.curfew}</div>
        )}

        <div className="flex gap-1">
          On-site Security: {shelter.onSiteSecurity ? 'Yes' : 'No'}
        </div>

        {shelter.otherRules && (
          <div
            className="flex gap-1"
            dangerouslySetInnerHTML={{
              __html: 'Other rules: ' + shelter?.otherRules,
            }}
          />
        )}
      </div>
    </Card>
  );
}
