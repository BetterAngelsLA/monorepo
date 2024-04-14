import { Spacings } from '@monorepo/expo/shared/static';
import React, { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

interface BottomOptionsProps {
  children: ReactNode;
  justifyContent?: 'space-around' | 'flex-start' | 'flex-end' | 'center';
}

const BottomOptions: React.FC<BottomOptionsProps> = ({
  children,
  justifyContent = 'flex-end',
}) => {
  const containerStyle = {
    ...styles.container,
    justifyContent,
  };

  return (
    <View style={styles.bottom}>
      <View style={containerStyle}>{children}</View>
    </View>
  );
};

const styles = StyleSheet.create({
  bottom: {
    paddingHorizontal: Spacings.sm,
    flexDirection: 'column',
    justifyContent: 'flex-end',
  },
  container: {
    flexDirection: 'row',
  },
});

export default BottomOptions;
