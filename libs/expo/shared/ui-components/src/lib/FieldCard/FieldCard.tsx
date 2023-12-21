import { Colors, Spacings } from '@monorepo/expo/shared/static';
import { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import BodyText from '../BodyText';
import H2 from '../H2';
import H5 from '../H5';

type TSpacing = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

interface IFieldCardProps {
  children: ReactNode;
  title: string;
  actionName: string;
  required?: boolean;
  mb?: TSpacing;
  mt?: TSpacing;
  my?: TSpacing;
  mx?: TSpacing;
  ml?: TSpacing;
  mr?: TSpacing;
  error?: boolean;
  expanded: string | undefined;
  setExpanded: () => void;
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
            error && expanded !== title ? Colors.ERROR : Colors.NEUTRAL_LIGHT,
        },
      ]}
    >
      <Pressable
        onPress={setExpanded}
        accessible
        accessibilityRole="button"
        accessibilityHint={`expands ${title} field`}
        style={[
          styles.header,
          { paddingBottom: expanded === title ? Spacings.sm : Spacings.md },
        ]}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          {expanded === title ? (
            <H2>{title}</H2>
          ) : (
            <BodyText size="sm">{title}</BodyText>
          )}
          {required && <BodyText color={Colors.ERROR}>*</BodyText>}
        </View>
        <H5 size="sm">{actionName}</H5>
      </Pressable>

      {children}
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
  },
});
