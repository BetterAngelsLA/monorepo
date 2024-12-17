import { FindMeIcon } from '@monorepo/react/icons';
import { useMap } from '@vis.gl/react-google-maps';
import { CurrentLocation } from '../../currentLocation/currentLocation';
import { TLocationError } from '../../currentLocation/currentLocationError';
import { TLatLng } from '../types.maps';
import { ControlBtnWrapper } from './controlBtnWrapper';

type TProps = {
  className?: string;
  onLocationSucccess?: (location: TLatLng) => void;
  onError?: (location: TLocationError) => void;
};

export function CurrentLocationBtn(props: TProps) {
  const { className = '', onError, onLocationSucccess } = props;

  const map = useMap();

  if (!map) {
    return;
  }

  function onLocationChange(location: TLatLng) {
    onLocationSucccess && onLocationSucccess(location);
  }

  function onLocationError(error: TLocationError) {
    onError && onError(error);
  }

  const innerCss = [
    'w-full',
    'h-full',
    'flex',
    'items-center',
    'justify-center',
  ].join(' ');

  return (
    <ControlBtnWrapper className={className}>
      <CurrentLocation
        className={innerCss}
        onChange={onLocationChange}
        onError={onLocationError}
      >
        <FindMeIcon className="h-5 fill-primary-60" />
      </CurrentLocation>
    </ControlBtnWrapper>
  );
}
