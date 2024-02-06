import { Colors, Spacings } from '@monorepo/expo/shared/static';
import { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import BodyText from '../BodyText';
import H2 from '../H2';

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
  error?: boolean;
  expanded: string | undefined | null;
  setExpanded: () => void;
  info?: ReactNode;
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
      >
        <View
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
            {info && info}
          </View>
          {actionName}
        </View>
        {children}
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
