import { Checkbox, TextRegular } from '@monorepo/expo/shared/ui-components';
import { StyleSheet, View } from 'react-native';

interface IServiceRequestOtherCheckboxProps {
  serviceRequest: {
    title: string | null;
    id?: string;
  };
  idx: number;
  serviceRequests: {
    id: string | undefined;
    title: string | null;
    markedForDeletion?: boolean;
  }[];
  setServiceRequests: (
    serviceRequests: {
      title: string | null;
      id: string | undefined;
      markedForDeletion?: boolean;
    }[]
  ) => void;
}

export default function ServiceRequestOtherCheckbox(
  props: IServiceRequestOtherCheckboxProps
) {
  const { serviceRequest, idx, serviceRequests, setServiceRequests } = props;

  const serviceEntry = serviceRequests.find(
    (s) => s.title === serviceRequest.title
  );
  const isChecked = (serviceEntry && !serviceEntry.markedForDeletion) || false;

  const handleCheck = () => {
    if (isChecked) {
      setServiceRequests(
        serviceRequests.map((s) =>
          s.title === serviceRequest.title
            ? { ...s, markedForDeletion: true }
            : s
        )
      );
    } else if (serviceEntry) {
      setServiceRequests(
        serviceRequests.map((s) =>
          s.title === serviceRequest.title
            ? { ...s, markedForDeletion: false }
            : s
        )
      );
    } else {
      setServiceRequests([
        ...serviceRequests,
        {
          title: serviceRequest.title,
          id: undefined,
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
      accessibilityHint={serviceRequest.title || ''}
      label={
        <View style={styles.labelContainer}>
          <TextRegular ml="xs">{serviceRequest.title}</TextRegular>
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
