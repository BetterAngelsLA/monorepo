import { Button, mergeCss } from '@monorepo/react/components';
import { useMap } from '@vis.gl/react-google-maps';

type TProps = {
  onClick?: () => void;
};

export function SearchMapAreaButton(props: TProps) {
  const { onClick } = props;

  const map = useMap();

  if (!map) {
    return;
  }

  const searchMapAreaCss = [
    'bg-white',
    'drop-shadow-lg',
    'mt-2',
    'rounded',
    'text-primary-60',
    'text-sm',
  ];

  return (
    <Button
      onClick={onClick}
      variant="secondary"
      size="md"
      className={mergeCss(searchMapAreaCss)}
    >
      Search this area
    </Button>
  );
}
