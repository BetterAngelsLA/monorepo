import { Card, ExpandableContainer } from '@monorepo/react/components';
import {
  EntryRequirementChoices,
  ReferralRequirementChoices,
  VaccinationRequirementChoices,
} from '../../../apollo';
import { WysiwygContainer } from '../../../components';
import {
  enumDisplayEntryRequirementChoices,
  enumDisplayReferralRequirementChoices,
  enumDisplayVaccinationRequirementChoices,
} from '../../../static';
import { ViewShelterQuery } from '../__generated__/shelter.generated';
import { InlineList, WysiwygSection } from '../common';
import { hasWysiwygContent } from '../utils';

export function EntryRequirements({
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
        <InlineList
          title="Referral Requirement:"
          items={shelter?.referralRequirement.map(
            (requirement) =>
              enumDisplayReferralRequirementChoices[
                requirement.name as ReferralRequirementChoices
              ]
          )}
        />
        <InlineList
          title="Vaccinations:"
          items={shelter?.vaccinationRequirement.map(
            (vaccination) =>
              enumDisplayVaccinationRequirementChoices[
                vaccination.name as VaccinationRequirementChoices
              ]
          )}
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
