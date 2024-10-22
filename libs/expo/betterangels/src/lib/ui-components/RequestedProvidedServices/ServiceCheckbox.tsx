import { Checkbox, TextRegular } from '@monorepo/expo/shared/ui-components';
import { StyleSheet, View } from 'react-native';
import { ServiceEnum } from '../../apollo';

interface IServiceCheckboxProps {
  service: {
    title: string;
    enum: ServiceEnum;
  };
  noteId: string | undefined;
  idx: number;
  services: {
    id: string | undefined;
    enum: ServiceEnum | null;
    markedForDeletion?: boolean;
  }[];
  setServices: (
    services: {
      enum: ServiceEnum | null;
      id: string | undefined;
      markedForDeletion?: boolean;
    }[]
  ) => void;
}

export default function ServiceCheckbox(props: IServiceCheckboxProps) {
  const { service, idx, services, setServices } = props;

  const serviceEntry = services.find((s) => s.enum === service.enum);
  const isChecked = (serviceEntry && !serviceEntry.markedForDeletion) || false;

  const handleCheck = () => {
    if (isChecked) {
      setServices(
        services.map((s) =>
          s.enum === service.enum ? { ...s, markedForDeletion: true } : s
        )
      );
    } else if (serviceEntry) {
      setServices(
        services.map((s) =>
          s.enum === service.enum ? { ...s, markedForDeletion: false } : s
        )
      );
    } else {
      setServices([
        ...services,
        { enum: service.enum, id: undefined, markedForDeletion: false },
      ]);
    }
  };

  return (
    <Checkbox
      isChecked={isChecked}
      mt={idx !== 0 ? 'xs' : undefined}
      hasBorder
      onCheck={handleCheck}
      accessibilityHint={service.title}
      label={
        <View style={styles.labelContainer}>
          <TextRegular ml="xs">{service.title}</TextRegular>
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
