import React, { ReactNode } from 'react';
import { View, StyleSheet } from 'react-native';

interface BottomOptionsProps {
  children: ReactNode;
  justifyContent?: 'space-around' | 'flex-start' | 'flex-end' | 'center';
}

const BottomOptions: React.FC<BottomOptionsProps> = ({
  children,
  justifyContent = 'flex-end'
}) => {
  const containerStyle = {
    ...styles.container,
    justifyContent,
  };

  return (
    <View style={styles.bottom}>
        <View style={containerStyle}>
            {children}
        </View>
    </View>
  );
};

const styles = StyleSheet.create({
  bottom: {
    // backgroundColor: 'rgba(5, 5, 5, 0.2)',
    flexDirection:'column',
    justifyContent: 'flex-end',
  },
  container: {
    flexDirection: 'row',
  },

});

export default BottomOptions;