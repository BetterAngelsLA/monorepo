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
          <div className="grid grid-cols-[auto_1fr] gap-x-1">
            <strong className="whitespace-nowrap">Max Stay:</strong>
            <span>{shelter.maxStay} days</span>
          </div>
        )}

        {shelter.exitPolicy?.length > 0 && (
          <div className="grid grid-cols-[auto_1fr] gap-x-1">
            <strong className="whitespace-nowrap">Exit Policy:</strong>
            <span>{exitPolicyDisplay.join('; ')}</span>
          </div>
        )}

        <div className="grid grid-cols-[auto_1fr] gap-x-1">
          <strong className="whitespace-nowrap">Curfew:</strong>
          <span>{hasCurfew ? formatCurfewTime(shelter.curfew) : 'No'}</span>
        </div>

        {shelter.visitorsAllowed != null && (
          <div className="grid grid-cols-[auto_1fr] gap-x-1">
            <strong className="whitespace-nowrap">Visitors:</strong>
            <span>{shelter.visitorsAllowed ? 'Allowed' : 'Not Allowed'}</span>
          </div>
        )}

        {shelter.emergencySurge != null && (
          <div className="grid grid-cols-[auto_1fr] gap-x-1">
            <strong className="whitespace-nowrap">Emergency Surge:</strong>
            <span>{shelter.emergencySurge ? 'Yes' : 'No'}</span>
          </div>
        )}
      </div>
    </Card>
  );
}
