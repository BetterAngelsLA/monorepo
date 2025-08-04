import {
  TMapView,
  TPlaceLatLng,
  TPlacesPrediction,
  getPlaceAutocomplete,
  getPlaceDetailsById,
  useUpdateNoteLocationMutation,
} from '@monorepo/expo/betterangels';
import { useApiConfig } from '@monorepo/expo/shared/clients';
import { LocationArrowIcon, SearchIcon } from '@monorepo/expo/shared/icons';
import { Colors, Spacings } from '@monorepo/expo/shared/static';
import {
  BasicInput,
  IconButton,
  TextRegular,
} from '@monorepo/expo/shared/ui-components';
import axios from 'axios';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { FlatList, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DEFAULT_LOCATION, INITIAL_LOCATION } from '../constants';
import Directions from './Directions';
import Header from './Header';
import Map from './Map';
import Selected from './Selected';

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
  setExpanded: (expanded: string | undefined | null) => void;
  noteId: string;
  setLocation: (location: TLocation) => void;
  location: TLocation;
  setError: (error: boolean) => void;
}

export default function LocationMapModal(props: ILocationMapModalProps) {
  const { setExpanded, noteId, location, setLocation, setError } = props;
  const { baseUrl } = useApiConfig();
  const mapRef = useRef<TMapView>(null);
  const [minizeModal, setMinimizeModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearch, setIsSearch] = useState(false);
  const [initialLocation, setInitialLocation] = useState(INITIAL_LOCATION);
  const [suggestions, setSuggestions] = useState<TPlacesPrediction[]>([]);
  const [chooseDirections, setChooseDirections] = useState(false);
  const [selected, setSelected] = useState<boolean>(false);
  const [userLocation, setUserLocation] =
    useState<Location.LocationObject | null>(null);
  const [address, setAddress] = useState<
    { short: string; full: string; addressComponents: unknown[] } | undefined
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
  const [hasUserCleared, setHasUserCleared] = useState(false);

  const insets = useSafeAreaInsets();
  const bottomOffset = insets.bottom;
  const router = useRouter();

  const closeModal = (hasLocation: boolean) => {
    setHasUserCleared(false);
    if (!location?.address && !hasLocation) {
      setError(true);
    } else {
      setError(false);
    }
    router.back();
    setExpanded(undefined);
  };

  useEffect(() => {
    return () => {
      setHasUserCleared(false);
    };
  }, []);

  const searchPlacesInCalifornia = useCallback(
    async (query: string) => {
      if (query.length < 3) return;

      try {
        const predictions = await getPlaceAutocomplete({
          baseUrl,
          query,
        });

        setIsSearch(true);
        setSuggestions(predictions);
      } catch (err) {
        console.error('Error fetching place data:', err);
        return [];
      }
    },
    [baseUrl]
  );

  const onSuggestionsSelect = async (place: TPlacesPrediction) => {
    try {
      if (chooseDirections) {
        setChooseDirections(false);
      }
      setLocation(undefined);

      const placeResult = await getPlaceDetailsById({
        baseUrl,
        placeId: place.place_id,
        fields: 'geometry,address_component',
        withCredentials: true,
      });

      const geometry = placeResult.geometry as google.maps.places.PlaceGeometry;
      const responseLocation = geometry.location as unknown as TPlaceLatLng;

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
        addressComponents: placeResult.address_components || [],
      });
      setMinimizeModal(false);
      setSelected(true);
      setHasUserCleared(false);
    } catch (err) {
      console.error(err);
    }
  };

  const onSearchChange = (query: string) => {
    setHasUserCleared(false);
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
    setHasUserCleared(true);
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

  const getLocation = useCallback(async () => {
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

    const url = `${baseUrl}/proxy/maps/api/geocode/json?latlng=${latitude},${longitude}`;

    try {
      // TODO: DEV-446 - Transition to react-native-google-places-autocomplete
      const { data } = await axios.get(url, {
        params: {
          withCredentials: true,
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
      setHasUserCleared(false);

      const { data: locationData } = await updateNoteLocation({
        variables: {
          data: {
            id: noteId || '',
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
        throw new Error(`Error updating interaction location: ${updateError}`);
      }
    } catch (err) {
      console.error(err);
    }
  }, [baseUrl, location, updateNoteLocation, noteId]);

  useEffect(() => {
    const handler = setTimeout(() => {
      if (searchQuery) {
        searchPlacesInCalifornia(searchQuery);
      }
    }, 500);

    return () => clearTimeout(handler);
  }, [searchQuery, searchPlacesInCalifornia]);

  useEffect(() => {
    getLocation();
  }, [getLocation]);

  useEffect(() => {
    if (location && location.address) {
      setAddress({
        short: location.name || location.address.split(',')[0] || '',
        full: location.address,
        addressComponents: [],
      });
      setCurrentLocation({
        longitude: location.longitude ?? DEFAULT_LOCATION.longitude,
        latitude: location.latitude ?? DEFAULT_LOCATION.latitude,
        name: location.name ?? DEFAULT_LOCATION.name,
      });
      setSelected(true);
      setHasUserCleared(false);
    } else {
      setAddress({
        short: DEFAULT_LOCATION.name,
        full: DEFAULT_LOCATION.address,
        addressComponents: [],
      });
      setCurrentLocation({
        longitude: DEFAULT_LOCATION.longitude,
        latitude: DEFAULT_LOCATION.latitude,
        name: DEFAULT_LOCATION.name,
      });
      setSelected(true);
      setHasUserCleared(false);
    }

    setSearchQuery('');
    setIsSearch(false);
    setSuggestions([]);
  }, [location]);

  const onDelete = () => {
    setHasUserCleared(true);
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
    <View
      style={{
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
            value={hasUserCleared ? '' : (address?.short || DEFAULT_LOCATION.name)}
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
  );
}
