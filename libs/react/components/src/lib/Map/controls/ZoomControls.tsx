import { useMap } from '@vis.gl/react-google-maps';
import { ControlBtnWrapper } from './ControlBtnWrapper';
import { ZoomButton } from './ZoomButton';

type TProps = {
  className?: string;
  zoomBy?: number;
};

export function ZoomControls(props: TProps) {
  const { className = '', zoomBy = 1 } = props;

  const map = useMap();

  if (!map) {
    return;
  }

  return (
    <div className={className}>
      <ControlBtnWrapper>
        <ZoomButton zoomBy={zoomBy} />
      </ControlBtnWrapper>
      <ControlBtnWrapper className="mt-1">
        <ZoomButton zoomBy={-zoomBy} />
      </ControlBtnWrapper>
    </div>
  );
}
