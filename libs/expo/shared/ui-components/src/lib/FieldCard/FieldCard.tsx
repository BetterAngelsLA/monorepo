import { Colors, Spacings } from '@monorepo/expo/shared/static';
import { ReactNode } from 'react';
import { DimensionValue, Pressable, StyleSheet, View } from 'react-native';
import TextMedium from '../TextMedium';
import TextRegular from '../TextRegular';

type TSpacing = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

interface IFieldCardProps {
  children: ReactNode;
  title: string;
  actionName: ReactNode;
  required?: boolean;
  mb?: TSpacing;
  mt?: TSpacing;
  my?: TSpacing;
  mx?: TSpacing;
  ml?: TSpacing;
  mr?: TSpacing;
  error?: string | undefined;
  expanded: string | undefined | null;
  setExpanded: () => void;
  info?: ReactNode;
  childHeight?: DimensionValue | undefined;
}

export function FieldCard(props: IFieldCardProps) {
  const {
    children,
    title,
    mb,
    mt,
    mr,
    ml,
    my,
    mx,
    actionName,
    required,
    error,
    expanded,
    setExpanded,
    info,
    childHeight,
  } = props;

  return (
    <View
      style={[
        styles.container,
        {
          marginBottom: mb && Spacings[mb],
          marginTop: mt && Spacings[mt],
          marginLeft: ml && Spacings[ml],
          marginRight: mr && Spacings[mr],
          marginHorizontal: mx && Spacings[mx],
          marginVertical: my && Spacings[my],
          borderColor:
            !!error && expanded !== title ? Colors.ERROR : Colors.NEUTRAL_LIGHT,
        },
      ]}
    >
      <Pressable
        onPress={setExpanded}
        accessible
        accessibilityRole="button"
        accessibilityHint={`expands ${title} field`}
      >
        <View style={[styles.header]}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            {expanded === title ? (
              <TextMedium size="lg">{title}</TextMedium>
            ) : (
              <TextRegular size="sm">{title}</TextRegular>
            )}
            {required && <TextRegular color={Colors.ERROR}>*</TextRegular>}
            {info && info}
          </View>
          {actionName}
        </View>
        {error && (
          <TextRegular mt="xs" color={Colors.ERROR}>
            {error}
          </TextRegular>
        )}
        <View
          style={{
            height: childHeight,
            overflow: 'hidden',
            marginTop: expanded === title ? Spacings.sm : Spacings.md,
          }}
        >
          {children}
        </View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacings.sm,
    borderRadius: 8,
    backgroundColor: Colors.WHITE,
    borderWidth: 1,
  },
  header: {
    paddingTop: Spacings.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
  },
});
