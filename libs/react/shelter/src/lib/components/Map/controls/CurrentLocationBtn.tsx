import { FindMeIcon } from '@monorepo/react/icons';
import { useMap } from '@vis.gl/react-google-maps';
import { CurrentLocation, TLocationError } from '../geolocation';
import { TLatLng } from '../types.maps';
import { ControlBtnWrapper } from './ControlBtnWrapper';

type TProps = {
  className?: string;
  onLocationSuccess?: (location: TLatLng) => void;
  onError?: (location: TLocationError) => void;
};

export function CurrentLocationBtn(props: TProps) {
  const { className = '', onError, onLocationSuccess } = props;

  const map = useMap();

  if (!map) {
    return;
  }

  function onLocationChange(location: TLatLng) {
    onLocationSuccess && onLocationSuccess(location);
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
