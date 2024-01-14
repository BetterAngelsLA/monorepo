import { PlusIcon } from '@monorepo/expo/shared/icons';
import { Colors } from '@monorepo/expo/shared/static';
import { BodyText, Checkbox, Input } from '@monorepo/expo/shared/ui-components';
import { useForm } from 'react-hook-form';
import { StyleSheet, View } from 'react-native';

interface IOtherCategoryProps {
  main: string;
  other: string;
  services: string[];
  setValue: (name: string, value: any) => void;
  control: ReturnType<typeof useForm>['control'];
  otherCategories: string[];
  setOtherCategories: (e: string[]) => void;
}

export default function OtherCategory(props: IOtherCategoryProps) {
  const {
    main,
    other,
    services,
    setValue,
    control,
    otherCategories,
    setOtherCategories,
  } = props;

  const handleOtherCategory = (e: string) => {
    setOtherCategories([...otherCategories, e]);
    setValue(main, [...services, e]);
    setValue(other, '');
  };

  const toggleServices = (service: string) => {
    const newServices = services.includes(service)
      ? services.filter((m: string) => m !== service)
      : [...services, service];
    setValue(main, newServices);
  };
  return (
    <>
      {otherCategories?.map((item) => (
        <Checkbox
          isChecked={services.includes(item)}
          mt={'xs'}
          key={item}
          hasBorder
          onCheck={() => toggleServices(item)}
          accessibilityHint={item}
          label={
            <View style={styles.labelContainer}>
              <PlusIcon color={Colors.PRIMARY_EXTRA_DARK} size="sm" />
              <BodyText ml="xs">{item}</BodyText>
            </View>
          }
        />
      ))}
      <Input
        placeholder="Enter other category"
        onSubmitEditing={(e) => handleOtherCategory(e.nativeEvent.text)}
        icon={<PlusIcon ml="sm" color={Colors.PRIMARY_EXTRA_DARK} size="sm" />}
        mt="xs"
        name={other}
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
