import { Card, ExpandableContainer } from '@monorepo/react/components';
import { EntryRequirementChoices } from '../../apollo';
import { WysiwygContainer } from '../../components';
import { enumDisplayEntryRequirementChoices } from '../../static';
import { ViewShelterQuery } from './__generated__/shelter.generated';
import { InlineList } from './shared/InlineList';
import { WysiwygSection } from './shared/WysiwygSection';
import { hasWysiwygContent } from './shared/hasWysiwygContent';

export default function EntryRequirements({
  shelter,
}: {
  shelter: ViewShelterQuery['shelter'];
}) {
  const hasNotesContent = hasWysiwygContent(shelter.addNotesShelterDetails);

  return (
    <Card title="Entry Requirements">
      <div className="flex flex-col gap-4">
        <InlineList
          title="Entry Requirements:"
          items={shelter.entryRequirements.map(
            (requirement) =>
              enumDisplayEntryRequirementChoices[
                requirement.name as EntryRequirementChoices
              ]
          )}
        />

        <WysiwygSection title="Entry Info:" content={shelter?.entryInfo} />

        <InlineList title="Bed Fees:" items={[shelter?.bedFees as string]} />

        <InlineList
          title="Program Fees:"
          items={[shelter?.programFees as string]}
        />

        {hasNotesContent && (
          <ExpandableContainer
            header="Additional Notes"
            className="w-full"
            iconClassName="w-[8px]"
            headerClassName="min-h-6 font-semibold"
          >
            <WysiwygContainer content={shelter.addNotesShelterDetails} />
          </ExpandableContainer>
        )}
      </div>
    </Card>
  );
}
