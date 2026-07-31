import { Card, ExpandableContainer } from '@monorepo/react/components';
import { format, isValid, parse } from 'date-fns';
import { ExitPolicyChoices } from '../../../apollo';
import { WysiwygContainer } from '../../../components';
import {
  displayListWithOther,
  enumDisplayExitPolicyChoices,
} from '../../../static';
import { ViewShelterQuery } from '../__generated__/shelter.generated';
import { InlineList } from '../common';
import { getRestrictionsFieldVisibility } from '../utils';

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
  const fieldVisibility = getRestrictionsFieldVisibility(shelter);
  const exitPolicyDisplay = displayListWithOther(
    shelter.exitPolicy as readonly { name?: ExitPolicyChoices.Other | null }[],
    shelter.exitPolicyOther,
    enumDisplayExitPolicyChoices,
    ExitPolicyChoices.Other
  );

  return (
    <Card title="Restrictions">
      <div className="flex flex-col gap-2">
        {fieldVisibility.maxStay && (
          <div className="flex gap-1">
            <strong>Max Stay:</strong>
            {shelter.maxStay} days
          </div>
        )}

        {fieldVisibility.exitPolicy && (
          <InlineList title="Exit Policy:" items={exitPolicyDisplay} />
        )}

        {fieldVisibility.curfew && (
          <div className="flex gap-1">
            <strong>Curfew:</strong>
            {shelter.curfew ? formatCurfewTime(shelter.curfew) : 'No'}
          </div>
        )}

        {fieldVisibility.visitorsAllowed && (
          <div className="flex gap-1">
            <strong>Visitors:</strong>
            {shelter.visitorsAllowed ? 'Allowed' : 'Not Allowed'}
          </div>
        )}

        {fieldVisibility.emergencySurge && (
          <div className="flex gap-1">
            <strong>Emergency Surge:</strong>
            {shelter.emergencySurge ? 'Yes' : 'No'}
          </div>
        )}

        {fieldVisibility.onSiteSecurity && (
          <div className="flex gap-1">
            <strong>On-site Security:</strong>
            {shelter.onSiteSecurity ? 'Yes' : 'No'}
          </div>
        )}

        {fieldVisibility.otherRules && (
          <ExpandableContainer
            header="Other Rules"
            className="mt-3 border-t border-neutral-90 pt-4"
            iconClassName="w-[8px]"
            headerClassName="min-h-6 font-semibold text-primary-20"
          >
            <WysiwygContainer content={shelter.otherRules} />
          </ExpandableContainer>
        )}
      </div>
    </Card>
  );
}
