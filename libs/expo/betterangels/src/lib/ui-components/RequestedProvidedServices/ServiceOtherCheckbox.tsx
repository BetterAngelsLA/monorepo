import { Checkbox, TextRegular } from '@monorepo/expo/shared/ui-components';
import { StyleSheet, View } from 'react-native';

interface IServiceOtherCheckboxProps {
  service: {
    serviceOther: string | null;
    serviceRequestId?: string;
  };
  idx: number;
  serviceRequests: {
    serviceRequestId: string | undefined;
    serviceOther: string | null;
    markedForDeletion?: boolean;
  }[];
  setServiceRequests: (
    serviceRequests: {
      serviceOther: string | null;
      serviceRequestId: string | undefined;
      markedForDeletion?: boolean;
    }[]
  ) => void;
}

export default function ServiceOtherCheckbox(
  props: IServiceOtherCheckboxProps
) {
  const { service, idx, serviceRequests, setServiceRequests } = props;

  const serviceEntry = serviceRequests.find(
    (s) => s.serviceRequestId === service.serviceRequestId
  );
  const isChecked = (serviceEntry && !serviceEntry.markedForDeletion) || false;

  const handleCheck = () => {
    if (isChecked) {
      setServiceRequests(
        serviceRequests.map((s) =>
          s.serviceRequestId === service.serviceRequestId
            ? { ...s, markedForDeletion: true }
            : s
        )
      );
    } else if (serviceEntry) {
      setServiceRequests(
        serviceRequests.map((s) =>
          s.serviceRequestId === service.serviceRequestId
            ? { ...s, markedForDeletion: false }
            : s
        )
      );
    } else {
      setServiceRequests([
        ...serviceRequests,
        {
          serviceOther: service.serviceOther,
          serviceRequestId: undefined,
          markedForDeletion: false,
        },
      ]);
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
