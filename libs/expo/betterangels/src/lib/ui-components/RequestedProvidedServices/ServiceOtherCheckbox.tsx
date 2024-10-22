import { Checkbox, TextRegular } from '@monorepo/expo/shared/ui-components';
import { StyleSheet, View } from 'react-native';

interface IServiceOtherCheckboxProps {
  service: {
    title: string | null;
    id?: string;
  };
  noteId: string | undefined;
  idx: number;
  services: {
    id: string | undefined;
    title: string | null;
    markedForDeletion?: boolean;
  }[];
  setServices: (
    services: {
      title: string | null;
      id: string | undefined;
      markedForDeletion?: boolean;
    }[]
  ) => void;
}

export default function ServiceOtherCheckbox(
  props: IServiceOtherCheckboxProps
) {
  const { service, idx, services, setServices } = props;

  const serviceEntry = services.find((s) => s.title === service.title);
  const isChecked = (serviceEntry && !serviceEntry.markedForDeletion) || false;

  const handleCheck = () => {
    if (isChecked) {
      setServices(
        services.map((s) =>
          s.title === service.title ? { ...s, markedForDeletion: true } : s
        )
      );
    } else if (serviceEntry) {
      setServices(
        services.map((s) =>
          s.title === service.title ? { ...s, markedForDeletion: false } : s
        )
      );
    } else {
      setServices([
        ...services,
        { title: service.title, id: undefined, markedForDeletion: false },
      ]);
    }
  };

  return (
    <Checkbox
      isChecked={isChecked}
      mt={idx !== 0 ? 'xs' : undefined}
      hasBorder
      onCheck={handleCheck}
      accessibilityHint={service.title || ''}
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
