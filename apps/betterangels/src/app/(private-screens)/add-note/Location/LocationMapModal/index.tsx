import { useUpdateNoteLocationMutation } from '@monorepo/expo/betterangels';
import { CSRF_HEADER_NAME } from '@monorepo/expo/shared/apollo';
import { LocationArrowIcon, SearchIcon } from '@monorepo/expo/shared/icons';
import { Colors, Spacings } from '@monorepo/expo/shared/static';
import {
  BasicInput,
  IconButton,
  TextRegular,
} from '@monorepo/expo/shared/ui-components';
import axios from 'axios';
import * as Location from 'expo-location';
import { getItem } from 'expo-secure-store';
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
// DEV-445 - Implement Import Aliases to Replace Long Relative Paths
import { apiUrl } from '../../../../../../config';

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
  noteId: string | undefined;
  setLocation: (location: TLocation) => void;
  location: TLocation;
  setError: (error: boolean) => void;
}

export default function LocationMapModal(props: ILocationMapModalProps) {
  const {
    isModalVisible,
    toggleModal,
    setExpanded,
    noteId,
    location,
    setLocation,
    setError,
  } = props;
  const mapRef = useRef<MapView>(null);
  const [minizeModal, setMinimizeModal] = useState(false);
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
  const [updateNoteLocation, { error: updateError }] =
    useUpdateNoteLocationMutation();

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
    const url = `${apiUrl}/proxy/maps/api/place/autocomplete/json`;
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
          components: 'country:us',
          strictBounds: true,
          withCredentials: true,
          headers: {
            CSRF_HEADER_NAME: getItem(CSRF_HEADER_NAME),
          },
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
        `${apiUrl}/proxy/maps/api/place/details/json`,
        {
          params: {
            place_id: place.place_id,
            fields: 'geometry,address_component',
            withCredentials: true,
            headers: {
              CSRF_HEADER_NAME: getItem(CSRF_HEADER_NAME),
            },
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
      setMinimizeModal(false);
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
    setMinimizeModal(false);
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

    const url = `${apiUrl}/proxy/maps/api/geocode/json?latlng=${latitude},${longitude}`;

    try {
      const { data } = await axios.get(url, {
        params: {
          withCredentials: true,
          headers: {
            CSRF_HEADER_NAME: getItem(CSRF_HEADER_NAME),
          },
        },
      });

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

      setLocation({
        longitude: longitude,
        latitude: latitude,
        address: googleAddress,
        name: undefined,
      });
      setMinimizeModal(false);
      setSelected(true);

      const { data: locationData } = await updateNoteLocation({
        variables: {
          data: {
            id: noteId,
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
        console.error('Error updating interaction location', updateError);
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
    setMinimizeModal(false);
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
                  setMinimizeModal(false);
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
                noteId={noteId}
                minimizeModal={minizeModal}
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
            setMinimizeModal={setMinimizeModal}
            setInitialLocation={setInitialLocation}
            initialLocation={initialLocation}
            setSelected={setSelected}
            setAddress={setAddress}
          />
        </View>
      </View>
    </Modal>
  );
}
