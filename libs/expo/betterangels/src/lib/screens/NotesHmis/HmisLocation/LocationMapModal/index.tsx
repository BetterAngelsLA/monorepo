import { useApiConfig } from '@monorepo/expo/shared/clients';
import { LocationArrowIcon, SearchIcon } from '@monorepo/expo/shared/icons';
import { Colors, Spacings } from '@monorepo/expo/shared/static';
import {
  BasicInput,
  IconButton,
  TextRegular,
} from '@monorepo/expo/shared/ui-components';
import * as ExpoLocation from 'expo-location';
import { useCallback, useEffect, useRef, useState } from 'react';
import { FlatList, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TMapView } from '../../../../maps';
import {
  TPlaceLatLng,
  TPlacesPrediction,
  getPlaceAutocomplete,
  getPlaceDetailsById,
} from '../../../../services';
import { LocationDraft } from '../../HmisProgramNoteForm';
import Directions from './Directions';
import Map from './Map';
import Selected from './Selected';

const INITIAL_LOCATION = {
  longitude: -118.258815,
  latitude: 34.048655,
};

type locationLongLat = {
  longitude: number;
  latitude: number;
  shortAddressName: string | undefined;
};

interface ILocationMapModalProps {
  setLocation: (location: LocationDraft) => void;
  location: LocationDraft;
  onClose?: () => void;
  setValue: (key: string, data: any) => void;
  userLocation: ExpoLocation.LocationObject | null;
}

export default function LocationMapModal(props: ILocationMapModalProps) {
  const { location, setLocation, onClose, setValue, userLocation } = props;

  const { baseUrl } = useApiConfig();
  const mapRef = useRef<TMapView>(null);

  const [minizeModal, setMinimizeModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearch, setIsSearch] = useState(false);
  const [suggestions, setSuggestions] = useState<TPlacesPrediction[]>([]);
  const [chooseDirections, setChooseDirections] = useState(false);
  const [selected, setSelected] = useState<boolean>(false);

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

  // Required by Map's IMapProps
  const [initialLocation, setInitialLocation] = useState<{
    longitude: number;
    latitude: number;
  }>(INITIAL_LOCATION);

  const insets = useSafeAreaInsets();
  const bottomOffset = insets.bottom;

  // --- Hydrate from existing note location once ---
  useEffect(() => {
    if (location?.latitude && location?.longitude) {
      const shortAddressName =
        location.shortAddressName ??
        (location.formattedAddress
          ? location.formattedAddress.split(', ')[0]
          : undefined);

      setCurrentLocation({
        latitude: location.latitude,
        longitude: location.longitude,
        shortAddressName,
      });

      setInitialLocation({
        latitude: location.latitude,
        longitude: location.longitude,
      });

      setAddress(
        location.formattedAddress
          ? {
              short: shortAddressName ?? '',
              full: location.formattedAddress,
              addressComponents: [],
            }
          : {
              short: shortAddressName ?? '',
              full: '',
              addressComponents: [],
            }
      );

      setSelected(true);
    } else {
      // No existing location: keep currentLocation undefined.
      setSelected(false);
    }
  }, [location]);

  // --- Search / autocomplete ---

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
      }
    },
    [baseUrl]
  );

  useEffect(() => {
    const handler = setTimeout(() => {
      if (searchQuery) {
        void searchPlacesInCalifornia(searchQuery);
      }
    }, 500);

    return () => clearTimeout(handler);
  }, [searchQuery, searchPlacesInCalifornia]);

  const onSuggestionsSelect = async (place: TPlacesPrediction) => {
    try {
      if (chooseDirections) {
        setChooseDirections(false);
      }

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

      const shortAddressName = place.description.split(', ')[0];

      const newLoc: LocationDraft = {
        longitude: responseLocation.lng,
        latitude: responseLocation.lat,
        shortAddressName,
        formattedAddress: place.description,
      };

      setCurrentLocation({
        longitude: responseLocation.lng,
        latitude: responseLocation.lat,
        shortAddressName,
      });

      setInitialLocation({
        longitude: responseLocation.lng,
        latitude: responseLocation.lat,
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

      setAddress({
        short: shortAddressName,
        full: place.description,
        addressComponents: placeResult.address_components || [],
      });

      setMinimizeModal(false);
      setSelected(true);

      // Hand result back up; parent owns persistence
      setLocation(newLoc);
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

  const onDelete = () => {
    if (!selected) return;
    onSearchDelete();
  };

  // --- User location button (just to move the camera) ---

  const goToUserLocation = async () => {
    try {
      if (mapRef.current && userLocation) {
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
    } catch (err) {
      console.error('Error getting user location', err);
    }
  };

  return (
    <View
      style={{
        overflow: 'hidden',
        flex: 1,
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

      {/* Search overlay */}
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

      {/* Bottom actions + Selected summary */}
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
            setValue={setValue}
            minimizeModal={minizeModal}
            currentLocation={currentLocation}
            address={address}
            setChooseDirections={setChooseDirections}
            setSelected={setSelected}
            onSelectLocation={(loc) => {
              setLocation(loc);
              onClose?.();
            }}
          />
        )}

        <View
          style={{
            height: bottomOffset,
            backgroundColor: currentLocation ? Colors.WHITE : 'transparent',
          }}
        />
      </View>

      {/* Map */}
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
  );
}
