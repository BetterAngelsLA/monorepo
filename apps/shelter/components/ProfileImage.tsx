import { StyleSheet, Image } from 'react-native';
import { Text, View } from './Themed';

interface ProfileImageProps {
  title: string;
  imageUrl?: string;
}

const ProfileImage = ({ title, imageUrl }: ProfileImageProps) => (
  <>
  {imageUrl ? (
      <Image
        accessibilityRole="image"
        style={styles.image}
        source={{
            uri: imageUrl,
        }}
      />
  ) : (
      <View style={styles.fallbackImage}>
        <Text style={styles.fallbackLetter}>{title.substring(0, 1)}</Text>
      </View>
  )}    
  </>
);

const styles = StyleSheet.create({
  image: {
    height: 60,
    width: 60,
    borderRadius: 40,
    resizeMode: 'cover',
  },
  fallbackImage: {
    width: 60,
    height: 60,        
    borderRadius: 40,

    borderColor: 'black',
    borderStyle: 'solid',
    borderWidth: 2,

    justifyContent: 'center'
  },
  fallbackLetter: {
    fontSize: 30,
    textAlign: 'center'
  },
});

export default ProfileImage;