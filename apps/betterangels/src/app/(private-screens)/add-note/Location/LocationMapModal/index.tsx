import { LocationArrowIcon, SearchIcon } from '@monorepo/expo/shared/icons';
import { Colors, Spacings } from '@monorepo/expo/shared/static';
import {
  BasicInput,
  BodyText,
  IconButton,
} from '@monorepo/expo/shared/ui-components';
import axios from 'axios';
import { useEffect, useState } from 'react';
import { useFormContext } from 'react-hook-form';
import { FlatList, Modal, TouchableOpacity, View } from 'react-native';
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
  const [pin, setPin] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearch, setIsSearch] = useState(false);
  const [initialLocation, setInitialLocation] = useState(INITIAL_LOCATION);
  const [suggestions, setSuggestions] = useState<any>([]);
  const [chooseDirections, setChooseDirections] = useState(false);
  const [selected, setSelected] = useState<boolean>(false);
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

    try {
      const response = await axios.get(url, {
        params: {
          input: query,
          key: apiKey,
          region: 'US-CA',
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
          marginTop: '15%',
          overflow: 'hidden',
          flex: 1,
        }}
      >
        <Header closeModal={closeModal} />
        <View
          style={{
            position: 'relative',
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
            <View
              style={{
                alignSelf: 'flex-end',
                paddingRight: Spacings.sm,
                marginBottom: Spacings.md,
                position: 'absolute',
                bottom: '100%',
                right: 0,
                zIndex: 100,
              }}
            >
              <IconButton
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
