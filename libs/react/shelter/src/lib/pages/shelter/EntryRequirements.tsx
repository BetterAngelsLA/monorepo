import { Card } from '@monorepo/react/components';
import { EntryRequirementChoices } from '../../apollo';
import { enumDisplayEntryRequirementChoices } from '../../static';
import { ViewShelterQuery } from './__generated__/shelter.generated';
import { InlineList } from './shared/InlineList';
import { WysiwygSection } from './shared/WysiwygSection';

export default function EntryRequirements({
  shelter,
}: {
  shelter: ViewShelterQuery['shelter'];
}) {
  return (
    <Card title="Entry Requirements">
      <div className="flex flex-col gap-2">
        <InlineList
          title="Entry Requirements:"
          items={shelter.entryRequirements.map(
            (requirement) =>
              enumDisplayEntryRequirementChoices[
                requirement.name as EntryRequirementChoices
              ]
          )}
        />

        <WysiwygSection
          className="mt-2"
          title="Entry Info:"
          content={shelter?.entryInfo}
        />

        <InlineList
          className="mt-2"
          title="Bed Fees:"
          items={[shelter?.bedFees as string]}
        />

        <InlineList
          className="mt-2"
          title="Program Fees:"
          items={[shelter?.programFees as string]}
        />
      </div>
    </Card>
  );
}
