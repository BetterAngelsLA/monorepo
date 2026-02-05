import * as ExpoLocation from 'expo-location';

export type TLocationData = {
  latitude: number;
  longitude: number;
  name: string;
  address: string;
  addressComponents: unknown[];
};

export interface ILocationMapModalProps {
  initialLocation?: {
    latitude: number;
    longitude: number;
    name?: string;
    address?: string;
  } | null;
  onSelectLocation: (location: TLocationData) => void;
  onClearLocation?: () => void;
  onClose?: () => void;
  userLocation?: ExpoLocation.LocationObject | null;
}
