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
  service: TItem;
  idx: number;
  services: SelectedService[];
  setServices: React.Dispatch<React.SetStateAction<SelectedService[]>>;
}

export default function ServiceCheckbox(props: IServiceCheckboxProps) {
  const { service, idx, services, setServices } = props;
  const entry = services.find((s) => s.serviceId === service.id);
  const isChecked = !!entry && (!entry.requestId || !entry.markedForDeletion);

  const handleCheck = () => {
    setServices((prev: SelectedService[]) => {
      const i = prev.findIndex((s) => s.serviceId === service.id);
      if (i === -1) {
        return [...prev, { serviceId: service.id, label: service.label }];
      }

      const cur = prev[i];

      if (!cur.requestId) {
        return prev.filter((s) => s.serviceId !== service.id);
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
      accessibilityHint={service.label}
      label={
        <View style={styles.labelContainer}>
          <TextRegular style={{ flex: 1 }} ml="xs">
            {service.label}
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
