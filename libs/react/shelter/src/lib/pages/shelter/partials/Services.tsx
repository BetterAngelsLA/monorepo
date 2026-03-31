import { Card, ExpandableContainer } from '@monorepo/react/components';
import { WysiwygContainer } from '../../../components';
import { ViewShelterQuery } from '../__generated__/shelter.generated';
import { hasWysiwygContent } from '../utils';
import { GeneralServices } from './GeneralServices';

export function Services({
  shelter,
}: {
  shelter: ViewShelterQuery['shelter'];
}) {
  const hasStructured = !!shelter.services?.length;
  const hasFreeform = hasWysiwygContent(shelter.otherServices);

  if (!hasStructured && !hasFreeform) return null;

  return (
    <Card title="Services">
      {hasStructured && <GeneralServices shelter={shelter} />}

      {hasFreeform && (
        <ExpandableContainer
          header="Other Services"
          className="mt-5 border-t border-neutral-90 pt-4"
          iconClassName="w-[8px]"
          headerClassName="min-h-6 font-semibold text-primary-20"
        >
          <WysiwygContainer content={shelter.otherServices} />
        </ExpandableContainer>
      )}
    </Card>
  );
}
