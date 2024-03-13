import { Linking, StyleSheet } from 'react-native';
import AnimatedButton from './AnimatedButton';

interface ContactButtonsRowProps {
  phoneNumber?: string;
  email?: string;
  website?: string;
}

const ContactButtonsRow = ({ phoneNumber, email, website }: ContactButtonsRowProps) => {
  const handlePressWebsite = () => {
    if (website) Linking.openURL(website);
  };    
  const handlePressEmail = () => {
    if (email) Linking.openURL(`mailto:${email}`);
  };
  const handlePressPhone = () => {
    if (phoneNumber) Linking.openURL(`tel:${phoneNumber}`);
  };

  return (
    <>
      {phoneNumber && (
        <AnimatedButton 
          iconName="external-link" 
          onPress={handlePressWebsite} 
        />
      )}
      {email && (
        <AnimatedButton 
          iconName="envelope" 
          onPress={handlePressEmail} 
        />
      )}            
      {phoneNumber && (
        <AnimatedButton 
          iconName="phone" 
          onPress={handlePressPhone} 
        />
      )}
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    padding: 10,
  },
});

export default ContactButtonsRow;