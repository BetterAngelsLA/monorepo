import { LocationArrowIcon, SearchIcon } from '@monorepo/expo/shared/icons';
import { Colors, Spacings } from '@monorepo/expo/shared/static';
import {
  BasicInput,
  BodyText,
  IconButton,
} from '@monorepo/expo/shared/ui-components';
import axios from 'axios';
import * as Location from 'expo-location';
import { useEffect, useRef, useState } from 'react';
import { useFormContext } from 'react-hook-form';
import {
  FlatList,
  Modal,
  Platform,
  TouchableOpacity,
  View,
} from 'react-native';
import MapView from 'react-native-maps';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Directions from './Directions';
import Header from './Header';
import Map from './Map';
import Selected from './Selected';

const apiKey = process.env.EXPO_PUBLIC_GOOGLEMAPS_APIKEY;

const INITIAL_LOCATION = {
  longitude: -118.258815,
  latitude: 34.048655,
};

type locationLongLat = {
  longitude: number;
  latitude: number;
  name: string | undefined;
};

interface ILocationMapModalProps {
  isModalVisible: boolean;
  toggleModal: (e: boolean) => void;
  setExpanded: (e: string | undefined | null) => void;
}

export default function LocationMapModal(props: ILocationMapModalProps) {
  const { isModalVisible, toggleModal, setExpanded } = props;
  const { trigger, setValue } = useFormContext();
  const mapRef = useRef<MapView>(null);
  const [pin, setPin] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearch, setIsSearch] = useState(false);
  const [initialLocation, setInitialLocation] = useState(INITIAL_LOCATION);
  const [suggestions, setSuggestions] = useState<any>([]);
  const [chooseDirections, setChooseDirections] = useState(false);
  const [selected, setSelected] = useState<boolean>(false);
  const [userLocation, setUserLocation] =
    useState<Location.LocationObject | null>(null);
  const [address, setAddress] = useState<
    { short: string; full: string } | undefined
  >({
    short: '',
    full: '',
  });
  const [currentLocation, setCurrentLocation] = useState<
    locationLongLat | undefined
  >(undefined);

  const insets = useSafeAreaInsets();
  const bottomOffset = insets.bottom;

  const closeModal = () => {
    trigger('location.address');
    toggleModal(false);
    setExpanded(undefined);
  };

  const searchPlacesInCalifornia = async (query: string) => {
    const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json`;
    if (query.length < 3) return;

    // geocode for approx center of LA COUNTY
    const center = { lat: 34.04499, lng: -118.251601 };
    const defaultBounds = {
      north: center.lat + 0.1,
      south: center.lat - 0.1,
      east: center.lng + 0.1,
      west: center.lng - 0.1,
    };

    try {
      const response = await axios.get(url, {
        params: {
          bounds: defaultBounds,
          input: query,
          key: apiKey,
          components: 'country:us',
          strictBounds: true,
        },
      });

      setIsSearch(true);

      setSuggestions(response.data.predictions);
    } catch (error) {
      console.error('Error fetching place data:', error);
      return [];
    }
  };

  const onSuggestionsSelect = async (place: any) => {
    try {
      if (chooseDirections) {
        setChooseDirections(false);
      }
      setValue('location', undefined);
      const response = await axios.get(
        'https://maps.googleapis.com/maps/api/place/details/json',
        {
          params: {
            place_id: place.place_id,
            fields: 'geometry',
            key: apiKey,
          },
        }
      );
      const { location } = response.data.result.geometry;
      setIsSearch(false);
      setSuggestions([]);

      setCurrentLocation({
        longitude: location.lng,
        latitude: location.lat,
        name: place.description.split(', ')[0],
      });

      mapRef.current?.animateToRegion(
        {
          latitude: location.lat,
          longitude: location.lng,
          latitudeDelta: 0.005,
          longitudeDelta: 0.005,
        },
        500
      );

      setInitialLocation({
        longitude: location.lng,
        latitude: location.lat,
      });

      setAddress({
        short: place.description,
        full: place.description,
      });
      setPin(true);
      setSelected(true);
    } catch (e) {
      console.log(e);
    }
  };

  const onSearchChange = (query: string) => {
    setAddress({
      full: query,
      short: query,
    });
    setSearchQuery(query);
  };

  const goToUserLocation = () => {
    if (userLocation && mapRef.current) {
      mapRef.current.animateToRegion(
        {
          latitude: userLocation.coords.latitude,
          longitude: userLocation.coords.longitude,
          latitudeDelta: 0.005,
          longitudeDelta: 0.005,
        },
        500
      );
    }
  };

  const onSearchDelete = () => {
    setAddress(undefined);
    setCurrentLocation(undefined);
    setValue('location', undefined);
    setPin(false);
    setSearchQuery('');
    setIsSearch(false);
    setSuggestions([]);
    setSelected(false);
    if (chooseDirections) {
      setChooseDirections(false);
    }
  };

  useEffect(() => {
    const handler = setTimeout(() => {
      if (searchQuery) {
        searchPlacesInCalifornia(searchQuery);
      }
    }, 500);

    return () => clearTimeout(handler);
  }, [searchQuery]);

  useEffect(() => {
    getLocation();
  }, []);

  const getLocation = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      return;
    }
    const userCurrentLocation = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });
    const { latitude, longitude } = userCurrentLocation.coords;

    setUserLocation(userCurrentLocation);

    const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${apiKey}`;

    try {
      const { data } = await axios.get(url);
      setValue('location', undefined);
      setCurrentLocation({
        longitude,
        latitude,
        name: undefined,
      });

      setInitialLocation({
        longitude,
        latitude,
      });

      const googleAddress = data.results[0].formatted_address;
      const shortAddress = googleAddress.split(', ')[0];

      setAddress({
        short: shortAddress,
        full: googleAddress,
      });
      setPin(true);

      setValue('location', {
        longitude: longitude,
        latitude: latitude,
        address: googleAddress,
        name: undefined,
      });
      setSelected(true);
    } catch (e) {
      console.log(e);
    }
  };

  const onDelete = () => {
    if (!selected) return;
    setAddress(undefined);
    setCurrentLocation(undefined);
    setValue('location', undefined);
    setPin(false);
    setSearchQuery('');
    setIsSearch(false);
    setSuggestions([]);
    setSelected(false);
    if (chooseDirections) {
      setChooseDirections(false);
    }
  };

  return (
    <Modal
      style={{ flex: 1 }}
      animationType="slide"
      transparent={true}
      visible={isModalVisible}
      onRequestClose={closeModal}
    >
      <View
        style={{
          borderTopEndRadius: 10,
          borderTopLeftRadius: 10,
          marginTop: Platform.OS === 'ios' ? '15%' : '5%',
          overflow: 'hidden',
          flex: 1,
        }}
      >
        <Header closeModal={closeModal} />
        <View
          style={{
            position: 'relative',
            flex: 1,
            zIndex: 1,
          }}
        >
          {chooseDirections && (
            <Directions
              setChooseDirections={setChooseDirections}
              setSelected={setSelected}
              address={address}
              currentLocation={currentLocation}
            />
          )}
          <View
            style={{
              position: 'absolute',
              zIndex: 1000,
              paddingHorizontal: Spacings.sm,
              backgroundColor: isSearch ? Colors.WHITE : 'transparent',
              width: '100%',
              height: isSearch ? '100%' : 'auto',
              flex: 1,
            }}
          >
            <BasicInput
              onKeyPress={({ nativeEvent }) => {
                nativeEvent.key === 'Backspace' && onDelete();
              }}
              onFocus={() => {
                if (chooseDirections) {
                  setChooseDirections(false);
                  setSelected(true);
                }
              }}
              onDelete={onSearchDelete}
              mt="sm"
              placeholder="Type location"
              icon={<SearchIcon ml="sm" color={Colors.NEUTRAL_LIGHT} />}
              value={address?.short}
              onChangeText={onSearchChange}
            />
            <FlatList
              style={{
                backgroundColor: Colors.WHITE,
                flex: 1,
              }}
              data={suggestions}
              keyExtractor={(item) => item.place_id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={{
                    borderBottomWidth: 1,
                    borderBottomColor: Colors.NEUTRAL_LIGHT,
                    paddingVertical: Spacings.sm,
                  }}
                  accessibilityRole="button"
                  onPress={() => onSuggestionsSelect(item)}
                >
                  <BodyText>{item.description.split(', ')[0]}</BodyText>
                  <BodyText color={Colors.NEUTRAL_DARK} size="xxs">
                    {item.description.split(', ')[1]},{' '}
                    {item.description.split(', ')[2]}
                  </BodyText>
                </TouchableOpacity>
              )}
            />
          </View>
          <View
            style={{
              position: 'absolute',
              bottom: 0,
              width: '100%',
              left: 0,
              zIndex: 100,
            }}
          >
            {userLocation && (
              <View
                style={{
                  alignSelf: 'flex-end',
                  paddingRight: Spacings.sm,
                  marginBottom: Spacings.md,
                }}
              >
                <IconButton
                  onPress={goToUserLocation}
                  style={{
                    elevation: 5,
                    shadowColor: Colors.NEUTRAL_DARK,
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.25,
                    shadowRadius: 3.84,
                  }}
                  accessibilityLabel="user location"
                  variant="secondary"
                  accessibilityHint="get user location"
                >
                  <LocationArrowIcon color={Colors.PRIMARY} />
                </IconButton>
              </View>
            )}
            {selected && currentLocation && (
              <Selected
                currentLocation={currentLocation}
                address={address}
                setChooseDirections={setChooseDirections}
                setSelected={setSelected}
                closeModal={closeModal}
              />
            )}

            <View
              style={{
                height: bottomOffset,
                backgroundColor: currentLocation ? Colors.WHITE : 'transparent',
              }}
            />
          </View>
          <Map
            userLocation={userLocation}
            ref={mapRef}
            chooseDirections={chooseDirections}
            setChooseDirections={setChooseDirections}
            currentLocation={currentLocation}
            setCurrentLocation={setCurrentLocation}
            pin={pin}
            setInitialLocation={setInitialLocation}
            initialLocation={initialLocation}
            setPin={setPin}
            setSelected={setSelected}
            setAddress={setAddress}
          />
        </View>
      </View>
    </Modal>
  );
}
