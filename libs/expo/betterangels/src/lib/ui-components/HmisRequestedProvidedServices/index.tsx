import { Spacings } from '@monorepo/expo/shared/static';
import { FieldCard, Pill } from '@monorepo/expo/shared/ui-components';
import { useFormContext } from 'react-hook-form';
import { View } from 'react-native';
import { ServiceRequestTypeEnum } from '../../apollo';
import { useModalScreen } from '../../providers';
import { ViewHmisNoteQuery } from '../../screens/NotesHmis/HmisProgramNoteView/__generated__/HmisProgramNoteView.generated';
import { enumDisplayServiceType } from '../../static';
import ServicesModal from './ServicesModal';

type GqlServiceRow = NonNullable<
  NonNullable<
    | ViewHmisNoteQuery['hmisNote']['providedServices']
    | ViewHmisNoteQuery['hmisNote']['requestedServices']
  >[number]
>;

type ServiceRowWithLocal = GqlServiceRow & { markedForDeletion?: boolean };

interface IRequestedServicesProps {
  services?: ServiceRowWithLocal[] | null;
  type: ServiceRequestTypeEnum.Provided | ServiceRequestTypeEnum.Requested;
}

export default function HmisRequestedProvidedServices(
  props: IRequestedServicesProps
) {
  const { services: selectedServices, type } = props;
  const { showModalScreen } = useModalScreen();
  const { setValue, getValues } = useFormContext();

  if (!selectedServices) {
    return null;
  }

  return (
    <FieldCard
      actionName={
        selectedServices?.length ? (
          <View
            style={{
              flexDirection: 'row',
              flexWrap: 'wrap',
              gap: Spacings.xs,
            }}
          >
            {selectedServices
              ?.filter(({ markedForDeletion }) => !markedForDeletion)
              .map((item, index) => (
                <Pill
                  variant={
                    type === ServiceRequestTypeEnum.Provided
                      ? 'success'
                      : 'warning'
                  }
                  key={index}
                  label={item.service?.label || item.serviceOther || ''}
                />
              ))}
          </View>
        ) : (
          ''
        )
      }
      mb="xs"
      title={`${enumDisplayServiceType[type]} Services`}
      setExpanded={() =>
        showModalScreen({
          presentation: 'fullScreenModal',
          hideHeader: true,
          content: (
            <ServicesModal
              onSelect={(e) => {
                const current = getValues('services') ?? {};
                setValue(
                  'services',
                  { ...current, ...e },
                  { shouldDirty: true }
                );
              }}
              type={type}
              selectedServices={selectedServices || []}
            />
          ),
        })
      }
    >
      <></>
    </FieldCard>
  );
}

export { default as ServicesModal } from './ServicesModal';
