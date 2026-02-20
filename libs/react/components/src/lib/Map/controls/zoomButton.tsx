import { PlusIcon } from '@monorepo/react/icons';
import { mergeCss } from '@monorepo/react/shared';
import { useMap } from '@vis.gl/react-google-maps';
import { ReactNode } from 'react';

type TProps = {
  zoomBy: number;
  className?: string;
  icon?: ReactNode;
  onClick?: () => void;
};

export function ZoomButton(props: TProps) {
  const { zoomBy, icon, className, onClick } = props;

  const zoomIcon = icon || getIcon(zoomBy);

  const map = useMap();

  function onZoom() {
    if (!map) {
      console.warn('[ZoomButton] map missing.');

      return;
    }

    const currentZoom = map.getZoom();

    if (currentZoom == null) {
      return;
    }

    if (onClick) {
      onClick();
    }

    map.setZoom(currentZoom + zoomBy);
  }

  const parentCss = [
    'w-full',
    'h-full',
    'flex',
    'items-center',
    'justify-center',
    'text-neutral-40',
    'text-2xl',
    className,
  ];

  if (!zoomBy) {
    return null;
  }

  return (
    <button onClick={onZoom} className={mergeCss(parentCss)}>
      {zoomIcon}
    </button>
  );
}

function getIcon(zoomBy: number) {
  if (zoomBy > 0) {
    return <PlusIcon className="w-4 text-neutral-40" />;
  }

  return <div className="w-4 h-[2.5px] bg-neutral-40 rounded opacity-95"></div>;
}
