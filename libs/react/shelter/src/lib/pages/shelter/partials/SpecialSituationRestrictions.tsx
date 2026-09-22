import { Card } from '@monorepo/react/components';
import { SpecialSituationRestrictionChoices } from '../../../apollo';
import { enumDisplaySpecialSituationRestrictionChoices } from '../../../static';
import { ViewShelterQuery } from '../__generated__/shelter.generated';

export function SpecialSituationRestrictions({
  shelter,
}: {
  shelter: ViewShelterQuery['shelter'];
}) {
  if (!shelter.specialSituationRestrictions?.length) return null;
  return (
    <Card title="Special Situation Restrictions">
      {shelter.specialSituationRestrictions
        .map((restriction) => restriction.name)
        .filter((name): name is SpecialSituationRestrictionChoices => !!name)
        .map((name) => enumDisplaySpecialSituationRestrictionChoices[name])
        .join(', ')}
    </Card>
  );
}
