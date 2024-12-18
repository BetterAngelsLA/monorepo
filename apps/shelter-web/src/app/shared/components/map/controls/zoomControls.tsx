import { useMap } from '@vis.gl/react-google-maps';
import { ControlBtnWrapper } from './controlBtnWrapper';
import { ZoomButton } from './zoomButton';

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
        <ZoomButton zoomBy={1} />
      </ControlBtnWrapper>
      <ControlBtnWrapper className="mt-1">
        <ZoomButton zoomBy={-1} />
      </ControlBtnWrapper>
    </div>
  );
}
