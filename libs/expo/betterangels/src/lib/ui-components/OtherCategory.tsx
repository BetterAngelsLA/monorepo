import { PlusIcon } from '@monorepo/expo/shared/icons';
import { Colors } from '@monorepo/expo/shared/static';
import { BodyText, Checkbox, Input } from '@monorepo/expo/shared/ui-components';
import { useState } from 'react';
import { useFormContext } from 'react-hook-form';
import { StyleSheet, View } from 'react-native';

interface IOtherCategoryProps {
  services: {
    id: string | undefined;
    service: string | undefined;
    customService: string;
  }[];
  toggleServices: (service: string, isCustom: boolean) => void;
}

export default function OtherCategory(props: IOtherCategoryProps) {
  const { services, toggleServices } = props;
  const { control, setValue } = useFormContext();
  const [otherCategories, setOtherCategories] = useState<string[]>([]);

  const handleOtherCategory = async (e: string) => {
    if (otherCategories.includes(e)) {
      return;
    }
    setOtherCategories([...otherCategories, e]);
    setValue('otherCategory', '');
    toggleServices(e, true);
  };

  return (
    <>
      {services
        .filter((item) => item.customService)
        .map((service) => (
          <Checkbox
            isChecked={services
              .map((s) => s.customService)
              .includes(service.customService)}
            mt={'xs'}
            key={service.customService}
            hasBorder
            onCheck={() => toggleServices(service.customService, true)}
            accessibilityHint={service.customService}
            label={
              <View style={styles.labelContainer}>
                <PlusIcon color={Colors.PRIMARY_EXTRA_DARK} size="sm" />
                <BodyText ml="xs">{service.customService}</BodyText>
              </View>
            }
          />
        ))}
      <Input
        placeholder="Enter other category"
        onSubmitEditing={(e) => handleOtherCategory(e.nativeEvent.text)}
        icon={<PlusIcon ml="sm" color={Colors.PRIMARY_EXTRA_DARK} size="sm" />}
        mt="xs"
        name="otherCategory"
        height={40}
        control={control}
      />
    </>
  );
}

const styles = StyleSheet.create({
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
