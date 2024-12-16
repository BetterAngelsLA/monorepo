import { CardWrapper } from '@monorepo/react/components';
import { enumDisplayEntryRequirementChoices } from '../../static';
import { ViewShelterQuery } from './__generated__/shelter.generated';

export default function EntryRequirements({
  shelter,
}: {
  shelter?: ViewShelterQuery['shelter'];
}) {
  return (
    <CardWrapper title="Entry Requirements">
      <div className="flex flex-col gap-2">
        {shelter?.entryRequirements.map((requirement, idx) => {
          if (!requirement.name) return null;
          return (
            <div key={idx}>
              {enumDisplayEntryRequirementChoices[requirement.name]}
            </div>
          );
        })}
        {shelter?.entryInfo && (
          <div
            className="flex gap-1"
            dangerouslySetInnerHTML={{
              __html: 'Entry Info: ' + shelter?.entryInfo,
            }}
          />
        )}
        {shelter?.bedFees && (
          <div
            className="flex gap-1"
            dangerouslySetInnerHTML={{
              __html: 'Bed Fees: ' + shelter?.bedFees,
            }}
          />
        )}
        {shelter?.programFees && (
          <div
            className="flex gap-1"
            dangerouslySetInnerHTML={{
              __html: 'Program Fees: ' + shelter?.programFees,
            }}
          />
        )}
      </div>
    </CardWrapper>
  );
}
