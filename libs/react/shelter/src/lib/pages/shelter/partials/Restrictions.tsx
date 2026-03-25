import { Card } from '@monorepo/react/components';
import { format, isValid, parse } from 'date-fns';
import { ViewShelterQuery } from '../__generated__/shelter.generated';
import { WysiwygSection } from '../common';

function formatCurfewTime(curfew: string): string {
  const parsedTime = parse(curfew.trim(), 'HH:mm:ss', new Date());

  if (!isValid(parsedTime)) {
    return curfew;
  }

  return format(parsedTime, 'h:mm a');
}

export function Restrictions({
  shelter,
}: {
  shelter: ViewShelterQuery['shelter'];
}) {
  const hasCurfew = Boolean(shelter.curfew);

  return (
    <Card title="Restrictions">
      <div className="flex flex-col gap-2">
        {shelter.maxStay && (
          <div className="flex gap-1">
            <strong>Max Stay:</strong>
            {shelter.maxStay} days
          </div>
        )}

        <div className="flex gap-1">
          <strong>Curfew:</strong>
          {hasCurfew ? 'Yes' : 'None'}
        </div>

        {shelter.curfew && (
          <div className="flex gap-1">
            <strong>Time:</strong>
            {formatCurfewTime(shelter.curfew)}
          </div>
        )}

        {shelter.onSiteSecurity != null && (
          <div className="flex gap-1">
            <strong>On-site Security:</strong>
            {shelter.onSiteSecurity ? 'Yes' : 'No'}
          </div>
        )}

        <WysiwygSection title="Other rules:" content={shelter.otherRules} />
      </div>
    </Card>
  );
}
