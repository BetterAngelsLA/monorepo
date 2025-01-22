import { Spacings, TSpacing } from '@monorepo/expo/shared/static';
import { ReactNode } from 'react';
import { StyleProp, View, ViewStyle } from 'react-native';

interface IProps {
  mb?: TSpacing;
  mt?: TSpacing;
  my?: TSpacing;

  mx?: TSpacing;
  ml?: TSpacing;
  mr?: TSpacing;

  style?: StyleProp<ViewStyle>;

  children: ReactNode;
}

export function BaseContainer(props: IProps) {
  const { mb, mt, my, mx, ml, mr, style, children } = props;

  return (
    <View
      style={[
        style,
        {
          marginBottom: mb && Spacings[mb],
          marginTop: mt && Spacings[mt],
          marginHorizontal: mx && Spacings[mx],
          marginLeft: ml && Spacings[ml],
          marginRight: mr && Spacings[mr],
          marginVertical: my && Spacings[my],
        },
      ]}
    >
      {children}
    </View>
  );
}
