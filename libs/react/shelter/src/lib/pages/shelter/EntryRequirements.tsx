import { Card } from '@monorepo/react/components';
import { enumDisplayEntryRequirementChoices } from '../../static';
import { ViewShelterQuery } from './__generated__/shelter.generated';

export default function EntryRequirements({
  shelter,
}: {
  shelter: ViewShelterQuery['shelter'];
}) {
  return (
    <Card title="Entry Requirements">
      <div className="flex flex-col gap-2">
        {shelter.entryRequirements.map((requirement, idx) => {
          if (!requirement.name) return null;
          return (
            <div key={idx}>
              {enumDisplayEntryRequirementChoices[requirement.name]}
            </div>
          );
        })}
        {shelter.entryInfo && (
          <div
            dangerouslySetInnerHTML={{
              __html: 'Entry Info: ' + shelter?.entryInfo,
            }}
          />
        )}
        {shelter.bedFees && (
          <div
            dangerouslySetInnerHTML={{
              __html: 'Bed Fees: ' + shelter?.bedFees,
            }}
          />
        )}
        {shelter.programFees && (
          <div
            dangerouslySetInnerHTML={{
              __html: 'Program Fees: ' + shelter?.programFees,
            }}
          />
        )}
      </div>
    </Card>
  );
}
