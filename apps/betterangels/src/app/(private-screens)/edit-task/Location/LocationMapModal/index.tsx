import { useUpdateTaskLocationMutation } from '@monorepo/expo/betterangels';
import { LocationArrowIcon, SearchIcon } from '@monorepo/expo/shared/icons';
import { Colors, Spacings } from '@monorepo/expo/shared/static';
import {
  BasicInput,
  IconButton,
  TextRegular,
} from '@monorepo/expo/shared/ui-components';
import axios from 'axios';
import * as Location from 'expo-location';
import { useEffect, useRef, useState } from 'react';
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

type TLocation =
  | {
      address: string | null | undefined;
      latitude: number | null | undefined;
      longitude: number | null | undefined;
      name: string | null | undefined;
    }
  | undefined;

interface ILocationMapModalProps {
  isModalVisible: boolean;
  toggleModal: (e: boolean) => void;
  setExpanded: (expanded: string | undefined | null) => void;
  taskId: string | undefined;
  setLocation: (location: TLocation) => void;
  location: TLocation;
  setError: (error: boolean) => void;
}

export default function LocationMapModal(props: ILocationMapModalProps) {
  const {
    isModalVisible,
    toggleModal,
    setExpanded,
    taskId,
    location,
    setLocation,
    setError,
  } = props;
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
    { short: string; full: string; addressComponents: any[] } | undefined
  >({
    short: '',
    full: '',
    addressComponents: [],
  });
  const [currentLocation, setCurrentLocation] = useState<
    locationLongLat | undefined
  >(undefined);
  const [updateTaskLocation, { error: updateError }] =
    useUpdateTaskLocationMutation();

  const insets = useSafeAreaInsets();
  const bottomOffset = insets.bottom;

  const closeModal = (hasLocation: boolean) => {
    if (!location?.address && !hasLocation) {
      setError(true);
    } else {
      setError(false);
    }
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
    } catch (err) {
      console.error('Error fetching place data:', err);
      return [];
    }
  };

  const onSuggestionsSelect = async (place: any) => {
    try {
      if (chooseDirections) {
        setChooseDirections(false);
      }
      setLocation(undefined);
      const response = await axios.get(
        'https://maps.googleapis.com/maps/api/place/details/json',
        {
          params: {
            place_id: place.place_id,
            fields: 'geometry,address_component',
            key: apiKey,
          },
        }
      );
      const { location: responseLocation } = response.data.result.geometry;
      setIsSearch(false);
      setSuggestions([]);

      setCurrentLocation({
        longitude: responseLocation.lng,
        latitude: responseLocation.lat,
        name: place.description.split(', ')[0],
      });

      mapRef.current?.animateToRegion(
        {
          latitude: responseLocation.lat,
          longitude: responseLocation.lng,
          latitudeDelta: 0.005,
          longitudeDelta: 0.005,
        },
        500
      );

      setInitialLocation({
        longitude: responseLocation.lng,
        latitude: responseLocation.lat,
      });

      setAddress({
        short: place.description,
        full: place.description,
        addressComponents: response.data.result.address_components,
      });
      setPin(true);
      setSelected(true);
    } catch (err) {
      console.error(err);
    }
  };

  const onSearchChange = (query: string) => {
    setAddress({
      full: query,
      short: query,
      addressComponents: [],
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
    setLocation(undefined);
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
    if (location?.latitude && location?.longitude) return;

    const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${apiKey}`;

    try {
      const { data } = await axios.get(url);

      setLocation(undefined);
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
        addressComponents: data.results[0].address_components,
      });

      setPin(true);

      setLocation({
        longitude: longitude,
        latitude: latitude,
        address: googleAddress,
        name: undefined,
      });
      setSelected(true);

      const { data: locationData } = await updateTaskLocation({
        variables: {
          data: {
            id: taskId,
            location: {
              point: [longitude, latitude],
              address: {
                addressComponents: JSON.stringify(
                  data.results[0].address_components
                ),
                formattedAddress: googleAddress,
              },
            },
          },
        },
      });
      if (!locationData) {
        console.error('Error updating task location', updateError);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const onDelete = () => {
    if (!selected) return;
    setAddress(undefined);
    setCurrentLocation(undefined);
    setLocation(undefined);
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
      onRequestClose={() => closeModal(false)}
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
                  <TextRegular>{item.description.split(', ')[0]}</TextRegular>
                  <TextRegular color={Colors.NEUTRAL_DARK} size="xxs">
                    {item.description.split(', ')[1]},{' '}
                    {item.description.split(', ')[2]}
                  </TextRegular>
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
                taskId={taskId}
                setLocation={setLocation}
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
