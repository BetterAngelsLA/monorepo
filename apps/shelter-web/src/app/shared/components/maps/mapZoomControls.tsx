import { PlusIcon } from '@monorepo/react/icons';
import { ControlPosition, MapControl } from '@vis.gl/react-google-maps';
import { ControlButton } from './controlButton';

type TProps = {
  className?: string;
  map: google.maps.Map | null;
  zoomBy?: number;
  position?: ControlPosition;
};

export function MapZoomControls(props: TProps) {
  const {
    map,
    zoomBy = 1,
    position = ControlPosition.INLINE_END_BLOCK_END,
    className = '',
  } = props;

  function onZoomIn() {
    map?.setZoom(map.getZoom()! + zoomBy);
  }

  function onZoomOut() {
    map?.setZoom(map.getZoom()! - zoomBy);
  }

  if (!map) {
    return null;
  }

  return (
    <MapControl position={position}>
      <div className={className}>
        <ControlButton onClick={onZoomIn}>
          <PlusIcon className="w-4 text-neutral-40" />
        </ControlButton>
        <ControlButton className="mt-1.5" onClick={onZoomOut}>
          <div className="w-4 h-[3px] bg-neutral-40"></div>
        </ControlButton>
      </div>
    </MapControl>
  );
}
