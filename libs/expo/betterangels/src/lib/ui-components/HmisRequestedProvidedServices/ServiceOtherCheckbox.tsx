import { Checkbox, TextRegular } from '@monorepo/expo/shared/ui-components';
import { StyleSheet, View } from 'react-native';

type OtherRow = {
  serviceOther: string | null;
  serviceRequestId?: string;
  markedForDeletion?: boolean;
};

interface IServiceOtherCheckboxProps {
  service: OtherRow;
  idx: number;
  serviceRequests: OtherRow[];
  setServiceRequests: (rows: OtherRow[]) => void;
}

const isTmp = (id?: string) => !!id && id.startsWith('tmp-other-');

export default function ServiceOtherCheckbox(
  props: IServiceOtherCheckboxProps
) {
  const { service, idx, serviceRequests, setServiceRequests } = props;

  const serviceEntry = serviceRequests.find(
    (s) => s.serviceRequestId === service.serviceRequestId
  );

  const persisted =
    !!service.serviceRequestId && !isTmp(service.serviceRequestId);

  const isChecked = persisted ? !serviceEntry?.markedForDeletion : true;

  const handleCheck = () => {
    if (!serviceEntry) {
      return;
    }

    if (isChecked) {
      if (persisted) {
        setServiceRequests(
          serviceRequests.map((s) =>
            s.serviceRequestId === service.serviceRequestId
              ? { ...s, markedForDeletion: true }
              : s
          )
        );
      } else {
        setServiceRequests(serviceRequests.filter((_, i) => i !== idx));
      }
    } else {
      if (persisted) {
        setServiceRequests(
          serviceRequests.map((s) =>
            s.serviceRequestId === service.serviceRequestId
              ? { ...s, markedForDeletion: false }
              : s
          )
        );
      }
    }
  };

  return (
    <Checkbox
      isChecked={isChecked}
      mt={idx !== 0 ? 'xs' : undefined}
      hasBorder
      onCheck={handleCheck}
      accessibilityHint={service.serviceOther || ''}
      label={
        <View style={styles.labelContainer}>
          <TextRegular ml="xs">{service.serviceOther}</TextRegular>
        </View>
      }
    />
  );
}

const styles = StyleSheet.create({
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
