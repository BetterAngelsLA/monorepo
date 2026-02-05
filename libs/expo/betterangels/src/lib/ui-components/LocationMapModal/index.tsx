import { useApiConfig } from '@monorepo/expo/shared/clients';
import {
  LocationArrowIcon,
  LocationPinIcon,
  SearchIcon,
} from '@monorepo/expo/shared/icons';
import { Colors, Spacings } from '@monorepo/expo/shared/static';
import {
  BasicInput,
  IconButton,
  TextRegular,
} from '@monorepo/expo/shared/ui-components';
import * as ExpoLocation from 'expo-location';
import { useCallback, useEffect, useRef, useState } from 'react';
import { FlatList, StyleSheet, TouchableOpacity, View } from 'react-native';
import { MapPressEvent, PoiClickEvent } from 'react-native-maps';
import openMap from 'react-native-open-maps';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MapView, Marker, PROVIDER_GOOGLE, TMapView } from '../../maps';
import { getPlaceDetailsById, reverseGeocode } from '../../services';
import { DirectionsPicker } from './DirectionsPicker';
import { SelectedLocationPanel } from './SelectedLocationPanel';
import { ILocationMapModalProps, TLocationData } from './types';
import { useLocationSearch } from './useLocationSearch';

const DEFAULT_COORDS = { latitude: 34.048655, longitude: -118.258815 };
const DELTA = { latitudeDelta: 0.005, longitudeDelta: 0.005 };

export function LocationMapModal({
  initialLocation,
  onSelectLocation,
  onClearLocation,
  onClose,
  userLocation: propUserLocation,
}: ILocationMapModalProps) {
  const { baseUrl } = useApiConfig();
  const mapRef = useRef<TMapView>(null);
  const insets = useSafeAreaInsets();

  const [location, setLocation] = useState<TLocationData | null>(null);
  const [userLocation, setUserLocation] = useState(propUserLocation ?? null);
  const [minimized, setMinimized] = useState(false);
  const [showIosDirections, setShowIosDirections] = useState(false);

  const animateMap = useCallback((lat: number, lng: number) => {
    mapRef.current?.animateToRegion(
      { latitude: lat, longitude: lng, ...DELTA },
      500
    );
  }, []);

  // Search hook
  const {
    query,
    setQuery,
    suggestions,
    searching,
    selectSuggestion,
    clear: clearSearch,
  } = useLocationSearch({
    baseUrl,
    onSelect: (loc) => {
      setLocation(loc);
      setMinimized(false);
      animateMap(loc.latitude, loc.longitude);
    },
  });

  const center =
    location ??
    (userLocation
      ? {
          latitude: userLocation.coords.latitude,
          longitude: userLocation.coords.longitude,
        }
      : DEFAULT_COORDS);

  // Init from prop
  useEffect(() => {
    if (!initialLocation?.latitude || !initialLocation?.longitude) return;
    const name =
      initialLocation.name ?? initialLocation.address?.split(', ')[0] ?? '';
    setLocation({
      ...initialLocation,
      name,
      address: initialLocation.address ?? '',
      addressComponents: [],
    });
  }, [initialLocation]);

  useEffect(() => {
    if (propUserLocation) setUserLocation(propUserLocation);
  }, [propUserLocation]);

  // Geocode: POI click or map tap → full location data
  const geocode = useCallback(
    async (
      lat: number,
      lng: number,
      poiName?: string,
      placeId?: string
    ): Promise<TLocationData> => {
      try {
        if (placeId) {
          const r = await getPlaceDetailsById({ baseUrl, placeId });
          return {
            latitude: lat,
            longitude: lng,
            name: poiName || r.formatted_address?.split(', ')[0] || '',
            address: r.formatted_address || '',
            addressComponents: r.address_components || [],
          };
        }
        const r = await reverseGeocode({
          baseUrl,
          latitude: lat,
          longitude: lng,
        });
        return {
          latitude: lat,
          longitude: lng,
          name: r.shortAddress,
          address: r.formattedAddress,
          addressComponents: r.addressComponents,
        };
      } catch {
        const fallback = poiName || `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
        return {
          latitude: lat,
          longitude: lng,
          name: fallback,
          address: `${lat}, ${lng}`,
          addressComponents: [],
        };
      }
    },
    [baseUrl]
  );

  // Handlers
  const handleMapPress = useCallback(
    async (e: MapPressEvent | PoiClickEvent, isPoi: boolean) => {
      const { latitude, longitude } = e.nativeEvent.coordinate;
      const name =
        'name' in e.nativeEvent
          ? (e.nativeEvent.name as string)?.replace(/[\r\n]+/g, ' ')
          : undefined;
      const placeId =
        isPoi && 'placeId' in e.nativeEvent
          ? (e.nativeEvent.placeId as string)
          : undefined;
      setLocation(await geocode(latitude, longitude, name, placeId));
      setMinimized(false);
    },
    [geocode]
  );

  const clear = useCallback(() => {
    setLocation(null);
    clearSearch();
    setMinimized(false);
    setShowIosDirections(false);
    onClearLocation?.();
  }, [clearSearch, onClearLocation]);

  const confirm = useCallback(() => {
    if (location) {
      onSelectLocation(location);
      onClose?.();
    }
  }, [location, onSelectLocation, onClose]);

  const goToUser = useCallback(async () => {
    try {
      let loc = userLocation;
      if (!loc) {
        const { status } =
          await ExpoLocation.requestForegroundPermissionsAsync();
        if (status !== 'granted') return;
        loc = await ExpoLocation.getCurrentPositionAsync({
          accuracy: ExpoLocation.Accuracy.Balanced,
        });
        setUserLocation(loc);
      }
      animateMap(loc.coords.latitude, loc.coords.longitude);
    } catch (err) {
      console.error('Error getting user location:', err);
    }
  }, [userLocation, animateMap]);

  const openDirections = useCallback(
    (provider: 'apple' | 'google') => {
      if (location) {
        openMap({
          end: `${location.latitude},${location.longitude}`,
          query: location.address,
          provider,
          travelType: 'drive',
        });
      }
      setShowIosDirections(false);
    },
    [location]
  );

  return (
    <View style={styles.container}>
      {/* iOS Directions Picker */}
      {showIosDirections && location && (
        <DirectionsPicker
          onSelectApple={() => openDirections('apple')}
          onSelectGoogle={() => openDirections('google')}
          onCancel={() => setShowIosDirections(false)}
        />
      )}

      {/* Search */}
      <View style={[styles.searchBox, searching && styles.searchBoxExpanded]}>
        <BasicInput
          mt="sm"
          placeholder="Type location"
          icon={<SearchIcon ml="sm" color={Colors.NEUTRAL_LIGHT} />}
          value={location ? location.name : query}
          onChangeText={(t) => {
            // If there's a selected location and user starts typing, clear it and start searching
            if (location) {
              setLocation(null);
            }
            setQuery(t);
          }}
          onDelete={clear}
          onFocus={() => setShowIosDirections(false)}
        />
        {searching && (
          <FlatList
            style={styles.suggestions}
            data={suggestions}
            keyExtractor={(i) => i.placeId}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => {
              const [primary, ...rest] = item.description.split(', ');
              return (
                <TouchableOpacity
                  style={styles.suggestionItem}
                  onPress={() => selectSuggestion(item)}
                  accessibilityRole="button"
                  accessibilityLabel={item.description}
                  accessibilityHint="select this location"
                >
                  <TextRegular>{primary}</TextRegular>
                  <TextRegular color={Colors.NEUTRAL_DARK} size="xxs">
                    {rest.slice(0, 2).join(', ')}
                  </TextRegular>
                </TouchableOpacity>
              );
            }}
          />
        )}
      </View>

      {/* Bottom Panel */}
      <View style={styles.bottomPanel}>
        <View style={styles.userLocationBtn}>
          <IconButton
            onPress={goToUser}
            style={styles.shadowBtn}
            accessibilityLabel="My location"
            accessibilityHint="center map on your location"
            variant="secondary"
          >
            <LocationArrowIcon color={Colors.PRIMARY} />
          </IconButton>
        </View>

        {location && !minimized && (
          <SelectedLocationPanel
            location={location}
            onConfirm={confirm}
            onGetDirections={openDirections}
            onShowIosDirections={() => setShowIosDirections(true)}
          />
        )}

        <View
          style={[
            styles.safeAreaBottom,
            { height: insets.bottom },
            location && styles.safeAreaBottomActive,
          ]}
        />
      </View>

      {/* Map */}
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        showsUserLocation={!!userLocation}
        showsMyLocationButton={false}
        initialRegion={{ ...center, ...DELTA }}
        onPress={(e) => handleMapPress(e, false)}
        onPoiClick={(e) => handleMapPress(e, true)}
        onPanDrag={() => setMinimized(true)}
        onDoublePress={() => setMinimized(true)}
      >
        {location && (
          <Marker coordinate={location}>
            <LocationPinIcon size="2xl" />
          </Marker>
        )}
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, overflow: 'hidden' },
  map: { width: '100%', height: '100%' },
  searchBox: {
    position: 'absolute',
    zIndex: 1000,
    paddingHorizontal: Spacings.sm,
    width: '100%',
  },
  searchBoxExpanded: { backgroundColor: Colors.WHITE, height: '100%' },
  suggestions: { backgroundColor: Colors.WHITE, flex: 1 },
  suggestionItem: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.NEUTRAL_LIGHT,
    paddingVertical: Spacings.sm,
  },
  bottomPanel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: '100%',
    zIndex: 100,
  },
  userLocationBtn: {
    alignSelf: 'flex-end',
    paddingRight: Spacings.sm,
    marginBottom: Spacings.md,
  },
  shadowBtn: {
    elevation: 5,
    shadowColor: Colors.NEUTRAL_DARK,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  safeAreaBottom: {
    backgroundColor: 'transparent',
  },
  safeAreaBottomActive: {
    backgroundColor: Colors.WHITE,
  },
});

export default LocationMapModal;
