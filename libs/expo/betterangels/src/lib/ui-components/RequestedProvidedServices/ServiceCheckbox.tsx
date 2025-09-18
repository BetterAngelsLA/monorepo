import { Checkbox, TextRegular } from '@monorepo/expo/shared/ui-components';
import { StyleSheet, View } from 'react-native';
import { ServiceEnum } from '../../apollo';

interface IServiceCheckboxProps {
  service: string;
  idx: number;
  services: {
    id: string | undefined;
    enum?: ServiceEnum | null;
    label?: string | null;
    markedForDeletion?: boolean;
  }[];
  setServices: (
    services: {
      enum?: ServiceEnum | null;
      label?: string | null;
      id: string | undefined;
      markedForDeletion?: boolean;
    }[]
  ) => void;
}

export default function ServiceCheckbox(props: IServiceCheckboxProps) {
  const { service, idx, services, setServices } = props;

  const serviceEntry = services.find((s) => s.label === service);
  const isChecked = (serviceEntry && !serviceEntry.markedForDeletion) || false;

  const handleCheck = () => {
    if (isChecked) {
      setServices(
        services.map((s) =>
          s.label === service ? { ...s, markedForDeletion: true } : s
        )
      );
    } else if (serviceEntry) {
      setServices(
        services.map((s) =>
          s.label === service ? { ...s, markedForDeletion: false } : s
        )
      );
    } else {
      setServices([
        ...services,
        { label: service, id: undefined, markedForDeletion: false },
      ]);
    }
  };

  return (
    <Checkbox
      isChecked={isChecked}
      mt={idx !== 0 ? 'xs' : undefined}
      hasBorder
      onCheck={handleCheck}
      accessibilityHint={service}
      label={
        <View style={styles.labelContainer}>
          <TextRegular style={{ flex: 1 }} ml="xs">
            {service}
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
