import { ControlPosition, MapControl } from '@vis.gl/react-google-maps';
import { useCallback } from 'react';
import { useGeolocationPermission } from '../hooks/useGeolocationPermission';
import { CurrentLocationBtn } from './currentLocationBtn';
import { ZoomControls } from './zoomControls';

type TProps = {
  onLocate: () => void;
};

export function ZoomAndLocateControls(props: TProps) {
  const { onLocate } = props;

  const permission = useGeolocationPermission();
  const handleLocate = useCallback(onLocate, [onLocate]);

  return (
    <MapControl position={ControlPosition.INLINE_END_BLOCK_END}>
      <div className="mr-4">
        <ZoomControls />

        {permission !== 'denied' && (
          <CurrentLocationBtn className="mt-5" onClick={handleLocate} />
        )}
      </div>
    </MapControl>
  );
}
