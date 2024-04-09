import { FontAwesome } from '@expo/vector-icons';
import { useLocalSearchParams, useNavigation } from 'expo-router';
import {
  Linking,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';

import BadgeRow from '../../../components/BadgeRow';
import BottomOptions from '../../../components/BottomOptions';
import ContactButtonsRow from '../../../components/ContactButtonsRow';
import Description from '../../../components/Description';
import { ExternalLink } from '../../../components/ExternalLink';
import ProfileImage from '../../../components/ProfileImage';
import { Text, View } from '../../../components/Themed';

import { useEffect } from 'react';
import { useData } from '../../../providers/DataProvider';

function ShowAddress({ location, title }: { location: any; title: string }) {
  return (
    <TouchableOpacity
      accessibilityRole="button"
      onPress={() => openMap(location.latitude, location.longitude, title)}
      style={styles.description}
    >
      <Text>
        <FontAwesome name={'map-marker'} size={16} color={'black'} />
        &ensp;
        <Text style={styles.link}>
          {location.confidential
            ? 'Confidential Location'
            : location.street +
              ', ' +
              location.city +
              ' ' +
              location.postalCode}
          . SPA {location.sPA}
        </Text>
      </Text>
    </TouchableOpacity>
  );
}

const openMap = (lat: number, lon: number, label: string) => {
  const encodedLabel = encodeURIComponent(label);
  const url =
    Platform.OS === 'ios'
      ? `maps:${lat},${lon}?q=${encodedLabel}`
      : `geo:${lat},${lon}?q=${encodedLabel}`;

  Linking.openURL(url).catch((err: Error) =>
    console.error('An error occurred', err)
  );
};

function ShowPhone({ phone }: { phone: string }) {
  if (phone) {
    return (
      <TouchableOpacity
        accessibilityRole="button"
        onPress={() => Linking.openURL(`tel:${phone}`)}
        style={styles.description}
      >
        <Text>
          <FontAwesome name={'phone'} size={16} color={'black'} />
          &ensp;
          <Text style={styles.link}>{phone}</Text>
        </Text>
      </TouchableOpacity>
    );
  } else {
    return null;
  }
}

function ShowWebsite({ website }: { website: string }) {
  if (website) {
    return (
      <ExternalLink href={website}>
        <FontAwesome name={'link'} size={16} color={'black'} />
        &ensp;
        <Text style={styles.link}>{website}</Text>
      </ExternalLink>
    );
  } else {
    return null;
  }
}
export default function LocationProfile() {
  const navigation = useNavigation();
  const { locationId } = useLocalSearchParams<{ locationId: any }>();
  const { getLocation } = useData();
  const openLocation = getLocation(locationId);

  useEffect(() => {
    navigation.setOptions({
      headerShown: false,
    });
  }, [navigation]);

  if (!openLocation) {
    return (
      <View style={styles.screenContainer}>
        <Text style={styles.title}>Can't find location</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeContainer}>
      <View style={styles.screenContainer}>
        <ScrollView style={styles.scrollContainer}>
          <View
            style={{ alignItems: 'center', marginBottom: 20, marginTop: 25 }}
          >
            <ProfileImage
              title={openLocation.title}
              imageUrl={openLocation.profileImageUrl}
            />

            <Text style={styles.title}>{openLocation.title}</Text>
            {/* <Text style={styles.description}>{openLocation.description.overview}</Text> */}
            <Text style={styles.description}>
              {openLocation.program} for {openLocation.population}
            </Text>
          </View>
          <ShowAddress
            location={openLocation.location}
            title={openLocation.title}
          />
          <ShowPhone phone={openLocation.phone} />
          <ShowWebsite website={openLocation.website} />

          <View style={styles.descriptionsContainer}>
            <Description
              text={openLocation.description.layout}
              title="Bed Layout"
            />
            <Description
              text={openLocation.description.typicalStay}
              title="Typical Stay"
            />
            <Description
              text={openLocation.description.checkInTime}
              title="Checking In"
            />
          </View>

          <BadgeRow badges={openLocation.services} title="Services" />
          <BadgeRow badges={openLocation.requirements} title="Requirements" />
        </ScrollView>
        <BottomOptions justifyContent="space-around">
          <ContactButtonsRow
            phoneNumber={openLocation.phone}
            email={openLocation.email}
            website={openLocation.website}
          />
        </BottomOptions>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
  },
  screenContainer: {
    flex: 1,
  },
  scrollContainer: {
    marginHorizontal: 10,
  },
  title: {
    fontSize: 30,
    fontWeight: 'bold',
  },
  descriptionsContainer: {
    marginVertical: 15,
  },
  description: {
    marginBottom: 8,
  },
  link: {
    textDecorationLine: 'underline',
  },
});
