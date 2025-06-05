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
          <div className="flex gap-1">
            <strong>Max Stay:</strong>
            {shelter.maxStay} days
          </div>
        )}
        {shelter.curfew && (
          <div className="flex gap-1">
            <strong>Curfew:</strong>
            {shelter.curfew}
          </div>
        )}

        {shelter.onSiteSecurity != null && (
          <div className="flex gap-1">
            <strong>On-site Security:</strong>
            {shelter.onSiteSecurity ? 'Yes' : 'No'}
          </div>
        )}

        {shelter.otherRules && (
          <div
            dangerouslySetInnerHTML={{
              __html: `<strong>Other rules:</strong> ${shelter?.otherRules}`,
            }}
          />
        )}
      </div>
    </Card>
  );
}
