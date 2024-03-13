import React, {useState} from 'react';
import {View, Switch, StyleSheet, Text} from 'react-native';

interface ISwitchProps {
    title: string;
  }

const SwitchToggle = (props: ISwitchProps) => {
  const [isEnabled, setIsEnabled] = useState(false);
  const toggleSwitch = () => setIsEnabled(previousState => !previousState);
  const { title } = props;
  
  return (
    <View style={styles.container}>
      <Switch
        trackColor={{false: '#767577', true: '#81b0ff'}}
        thumbColor={isEnabled ? '#f5dd4b' : '#f4f3f4'}
        ios_backgroundColor="#3e3e3e"
        onValueChange={toggleSwitch}
        value={isEnabled}
      /> 
        <Text style={styles.paragraph}>{title}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  paragraph: {
    fontSize: 15,
    color: "black",
  },  
});

export default SwitchToggle;