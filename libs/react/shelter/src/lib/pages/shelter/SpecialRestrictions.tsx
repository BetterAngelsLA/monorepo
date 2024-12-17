import { Card } from '@monorepo/react/components';
import { SpecialSituationRestrictionChoices } from '../../apollo';
import { enumDisplaySpecialSituationRestrictionChoices } from '../../static';
import { ViewShelterQuery } from './__generated__/shelter.generated';

export default function SpecialSituationRestrictions({
  shelter,
}: {
  shelter: ViewShelterQuery['shelter'];
}) {
  if (!shelter.specialSituationRestrictions?.length) return null;
  return (
    <Card title="Special Situation Restrictions">
      {shelter.specialSituationRestrictions
        .filter(
          (
            restriction
          ): restriction is { name: SpecialSituationRestrictionChoices } =>
            !!restriction.name
        )
        .map(
          (restriction) =>
            enumDisplaySpecialSituationRestrictionChoices[restriction.name]
        )
        .join(', ')}
    </Card>
  );
}
