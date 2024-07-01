import { FontAwesome } from '@expo/vector-icons';
import { router } from 'expo-router';
import { StyleSheet, TouchableHighlight } from 'react-native';
import BadgeRow from '../components/BadgeRow';
import ProfileImage from '../components/ProfileImage';
import { Text, View } from './Themed';

type LocationPreviewProps = {
  id: string;
  title: string;
  profileImageUrl: string;
  location: any;
  program: Array<string>;
  population: Array<string>;
  services: Array<string>;
  // requirements: Array<string>;
};

function ShowAddress({ location }: { location: any }) {
  return (
    <Text style={styles.description}>
      <FontAwesome name={'map-marker'} size={16} color={'black'} />
      &ensp;
      {location.confidential
        ? 'Confidential Location'
        : location.street + ', ' + location.city + ' ' + location.postalCode}
      . SPA {location.sPA}
    </Text>
  );
}

const LocationPreview = (props: LocationPreviewProps) => {
  const {
    id,
    title,
    profileImageUrl,
    location,
    program,
    population,
    services,
    // requirements,
  } = props;

  return (
    <TouchableHighlight
      accessible
      accessibilityHint={`Open the ${title} page`}
      onPress={() => router.push(`/(location)/${id}`)}
      underlayColor="white"
      key={id}
    >
      <View style={styles.card}>
        <View style={styles.profileHeaderContainer}>
          <View style={styles.profileImageContainer}>
            <ProfileImage title={title} imageUrl={profileImageUrl} />
          </View>
          <View style={styles.textContainer}>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.description}>
              {program} for {population}
            </Text>
          </View>
        </View>
        <ShowAddress location={location} />
        <BadgeRow badges={services} />
      </View>
    </TouchableHighlight>
  );
};

const styles = StyleSheet.create({
  card: {
    // marginTop: StatusBar.currentHeight || 0,
    flex: 1,
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginVertical: 8,
    marginHorizontal: 16,
    shadowColor: '#171717',
    shadowOffset: { width: 1, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  profileHeaderContainer: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  profileImageContainer: {},
  textContainer: {
    marginStart: 10,
  },
  title: {
    fontSize: 24,
  },
  description: {
    marginBottom: 8,
    fontSize: 14,
  },
});

export default LocationPreview;
