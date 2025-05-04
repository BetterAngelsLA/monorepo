import { FindMeIcon } from '@monorepo/react/icons';
import { useMap } from '@vis.gl/react-google-maps';
import { mergeCss } from '../../../utils/styles/mergeCss';
import { TLocationError } from '../../currentLocation/currentLocationError';
import { TLatLng } from '../types.maps';
import { MapControlBtn } from './mapControlBtn';

type TProps = {
  className?: string;
  onClick: () => void;
  onLocationSuccess?: (location: TLatLng) => void;
  onError?: (location: TLocationError) => void;
};

export function CurrentLocationBtn(props: TProps) {
  const { className, onClick, onError, onLocationSuccess } = props;

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

  return (
    <MapControlBtn onClick={onClick} className={mergeCss(className)}>
      <FindMeIcon className="h-5 fill-primary-60" />
    </MapControlBtn>
  );
}
