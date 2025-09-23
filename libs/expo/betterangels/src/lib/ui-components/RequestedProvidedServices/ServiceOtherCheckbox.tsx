import { Checkbox, TextRegular } from '@monorepo/expo/shared/ui-components';
import { StyleSheet, View } from 'react-native';

interface IServiceOtherCheckboxProps {
  service: {
    serviceOther: string | null;
    serviceRequestId?: string;
  };
  idx: number;
  services: {
    serviceRequestId: string | undefined;
    serviceOther: string | null;
    markedForDeletion?: boolean;
  }[];
  setServices: (
    services: {
      serviceOther: string | null;
      serviceRequestId: string | undefined;
      markedForDeletion?: boolean;
    }[]
  ) => void;
}

export default function ServiceOtherCheckbox(
  props: IServiceOtherCheckboxProps
) {
  const { service, idx, services, setServices } = props;

  const serviceEntry = services.find(
    (s) => s.serviceOther === service.serviceOther
  );
  const isChecked = (serviceEntry && !serviceEntry.markedForDeletion) || false;

  const handleCheck = () => {
    if (isChecked) {
      setServices(
        services.map((s) =>
          s.serviceOther === service.serviceOther
            ? { ...s, markedForDeletion: true }
            : s
        )
      );
    } else if (serviceEntry) {
      setServices(
        services.map((s) =>
          s.serviceOther === service.serviceOther
            ? { ...s, markedForDeletion: false }
            : s
        )
      );
    } else {
      setServices([
        ...services,
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
