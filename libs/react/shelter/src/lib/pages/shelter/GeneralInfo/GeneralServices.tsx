import { PillContainer } from '@monorepo/react/components';
import { enumDisplayGeneralServiceChoices } from '../../../static';
import { ViewShelterQuery } from '../__generated__/shelter.generated';

export default function GeneralServices({
  shelter,
}: {
  shelter: ViewShelterQuery['shelter'];
}) {
  return (
    <>
      <div>
        <p>Available General Services</p>
      </div>
      <div className="pb-6">
        <PillContainer
          maxVisible={5}
          data={
            shelter.generalServices?.reduce<string[]>((acc, service) => {
              if (service.name) {
                const displayName =
                  enumDisplayGeneralServiceChoices[service.name];
                if (displayName) acc.push(displayName);
              }
              return acc;
            }, []) || []
          }
        />
      </div>
    </>
  );
}
