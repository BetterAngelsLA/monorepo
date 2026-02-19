import { useMap } from '@vis.gl/react-google-maps';
import { ControlBtnWrapper } from './ControlBtnWrapper';
import { ZoomButton } from './ZoomButton';

type TProps = {
  className?: string;
  zoomBy?: number;
};

export function ZoomControls(props: TProps) {
  // Temporary suppression to allow incremental cleanup without regressions.
  // ⚠️ If you're modifying this file, please remove this ignore and fix the issue.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
