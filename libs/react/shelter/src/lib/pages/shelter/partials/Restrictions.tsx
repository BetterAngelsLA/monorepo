import { Card } from '@monorepo/react/components';
import { format, isValid, parse } from 'date-fns';
import { ExitPolicyChoices } from '../../../apollo';
import {
  displayListWithOther,
  enumDisplayExitPolicyChoices,
} from '../../../static';
import { ViewShelterQuery } from '../__generated__/shelter.generated';

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
  const exitPolicyDisplay = displayListWithOther(
    shelter.exitPolicy as readonly { name?: ExitPolicyChoices.Other | null }[],
    shelter.exitPolicyOther,
    enumDisplayExitPolicyChoices,
    ExitPolicyChoices.Other
  );

  return (
    <Card title="Restrictions">
      <div className="flex flex-col gap-2">
        {shelter.maxStay && (
          <div className="flex gap-1">
            <strong>Max Stay:</strong>
            {shelter.maxStay} days
          </div>
        )}

        {shelter.exitPolicy?.length > 0 && (
          <div className="flex gap-1">
            <strong>Exit Policy:</strong>
            {exitPolicyDisplay.join('; ')}
          </div>
        )}

        <div className="flex gap-1">
          <strong>Curfew:</strong>
          {hasCurfew ? formatCurfewTime(shelter.curfew) : 'No'}
        </div>

        {shelter.visitorsAllowed != null && (
          <div className="flex gap-1">
            <strong>Visitors:</strong>
            {shelter.visitorsAllowed ? 'Allowed' : 'Not Allowed'}
          </div>
        )}

        {shelter.emergencySurge != null && (
          <div className="flex gap-1">
            <strong>Emergency Surge:</strong>
            {shelter.emergencySurge ? 'Yes' : 'No'}
          </div>
        )}
      </div>
    </Card>
  );
}
