import { Spacings } from '@monorepo/expo/shared/static';
import { FieldCard, Pill } from '@monorepo/expo/shared/ui-components';
import { useFormContext } from 'react-hook-form';
import { View } from 'react-native';
import { ServiceRequestTypeEnum } from '../../apollo';
import { useModalScreen } from '../../providers';
import { ServicesDraft } from '../../screens/NotesHmis/HmisProgramNoteForm';
import { enumDisplayServiceType } from '../../static';
import ServicesModal from './ServicesModal';

type ProvidedServiceRequests = NonNullable<
  ServicesDraft[ServiceRequestTypeEnum.Provided]
>['serviceRequests'];

type RequestedServiceRequests = NonNullable<
  ServicesDraft[ServiceRequestTypeEnum.Requested]
>['serviceRequests'];

type ProvidedRow = ProvidedServiceRequests[number];
type RequestedRow = RequestedServiceRequests[number];

type IRequestedServicesProps =
  | {
      type: ServiceRequestTypeEnum.Provided;
      services?: ProvidedRow[] | null;
    }
  | {
      type: ServiceRequestTypeEnum.Requested;
      services?: RequestedRow[] | null;
    };

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
          renderContent: ({ close }) => (
            <ServicesModal
              onSelect={(e) => {
                const current = getValues('services') ?? {};
                setValue(
                  'services',
                  { ...current, ...e },
                  { shouldDirty: true }
                );
              }}
              close={close}
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
