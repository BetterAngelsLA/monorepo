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
              __html: `<strong>Entry Info:</strong> ${shelter?.entryInfo}`,
            }}
          />
        )}
        {shelter.bedFees && (
          <div
            dangerouslySetInnerHTML={{
              __html: `<strong>Bed Fees:</strong> ${shelter?.bedFees}`,
            }}
          />
        )}
        {shelter.programFees && (
          <div
            dangerouslySetInnerHTML={{
              __html: `<strong>Program Fees:</strong> ${shelter?.programFees}`,
            }}
          />
        )}
      </div>
    </Card>
  );
}
