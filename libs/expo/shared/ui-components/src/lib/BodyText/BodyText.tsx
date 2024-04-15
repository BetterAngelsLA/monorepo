import { Colors, FontSizes, Spacings } from '@monorepo/expo/shared/static';
import { ReactNode } from 'react';
import { StyleSheet, Text, TextProps, TextStyle } from 'react-native';

type TSpacing = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

interface IBodyTextProps extends TextProps {
  children: ReactNode;
  textTransform?: 'none' | 'capitalize' | 'uppercase' | 'lowercase' | undefined;
  mb?: TSpacing;
  mt?: TSpacing;
  my?: TSpacing;
  mx?: TSpacing;
  ml?: TSpacing;
  mr?: TSpacing;
  textDecorationLine?:
    | 'none'
    | 'underline'
    | 'line-through'
    | 'underline line-through'
    | undefined;
  color?: string;
  size?: 'md' | 'sm' | 'xs' | 'xxs';
  style?: TextStyle;
}

export function BodyText(props: IBodyTextProps) {
  const {
    children,
    textTransform,
    mb,
    mt,
    mr,
    ml,
    my,
    mx,
    textDecorationLine,
    color = Colors.PRIMARY_EXTRA_DARK,
    size = 'md',
    style,
    ...rest
  } = props;
  return (
    <Text
      style={[
        styles.text,
        style,
        {
          textTransform,
          marginBottom: mb && Spacings[mb],
          marginTop: mt && Spacings[mt],
          marginLeft: ml && Spacings[ml],
          marginRight: mr && Spacings[mr],
          marginHorizontal: mx && Spacings[mx],
          marginVertical: my && Spacings[my],
          textDecorationLine,

          color,
          fontSize: FontSizes[size].fontSize,
          lineHeight: FontSizes[size].lineHeight,
        },
      ]}
      {...rest}
    >
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  text: {
    fontFamily: 'Poppins-Regular',
  },
});
