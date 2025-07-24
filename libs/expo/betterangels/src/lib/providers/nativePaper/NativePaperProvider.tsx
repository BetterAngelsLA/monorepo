import { Colors } from '@monorepo/expo/shared/static';
import React from 'react';
import {
    MD3LightTheme as DefaultTheme,
    PaperProvider,
} from 'react-native-paper';
import { en, registerTranslation } from 'react-native-paper-dates';

registerTranslation('en', en);

const customTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: Colors.PRIMARY_DARK,
    surface: Colors.WHITE,
    onSurface: Colors.PRIMARY_EXTRA_DARK,
    background: Colors.WHITE,
  },
};

export default function NativePaperProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return <PaperProvider theme={customTheme}>{children}</PaperProvider>;
}
