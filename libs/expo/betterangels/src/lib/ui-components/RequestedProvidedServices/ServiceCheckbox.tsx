import { Checkbox, TextRegular } from '@monorepo/expo/shared/ui-components';
import { StyleSheet, View } from 'react-native';

type TItem = { id: string; label: string };

type SelectedService = {
  requestId?: string;
  serviceId: string;
  label: string;
  markedForDeletion?: boolean;
};

interface IServiceCheckboxProps {
  serviceRequest: TItem;
  idx: number;
  serviceRequests: SelectedService[];
  setServiceRequests: React.Dispatch<React.SetStateAction<SelectedService[]>>;
}

export default function ServiceCheckbox(props: IServiceCheckboxProps) {
  const { serviceRequest, idx, serviceRequests, setServiceRequests } = props;
  const entry = serviceRequests.find((s) => s.serviceId === serviceRequest.id);
  const isChecked = !!entry && (!entry.requestId || !entry.markedForDeletion);

  const handleCheck = () => {
    setServiceRequests((prev: SelectedService[]) => {
      const i = prev.findIndex((s) => s.serviceId === serviceRequest.id);
      if (i === -1) {
        return [
          ...prev,
          { serviceId: serviceRequest.id, label: serviceRequest.label },
        ];
      }

      const cur = prev[i];

      if (!cur.requestId) {
        return prev.filter((s) => s.serviceId !== serviceRequest.id);
      }

      const next = [...prev];
      const currentlyChecked = !(cur.requestId && cur.markedForDeletion);
      next[i] = { ...cur, markedForDeletion: currentlyChecked };
      return next;
    });
  };

  return (
    <Checkbox
      isChecked={isChecked}
      mt={idx !== 0 ? 'xs' : undefined}
      hasBorder
      onCheck={handleCheck}
      accessibilityHint={serviceRequest.label}
      label={
        <View style={styles.labelContainer}>
          <TextRegular style={{ flex: 1 }} ml="xs">
            {serviceRequest.label}
          </TextRegular>
        </View>
      }
    />
  );
}

const styles = StyleSheet.create({
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
});
