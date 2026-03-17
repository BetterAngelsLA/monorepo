import { useLayoutEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Text } from '../../../components/base-ui/text/text';

export type SliderTabItem = {
  label: string;
  pathSuffix: string;
};

type SliderTabsProps = {
  activePathSuffix: string;
  basePath: string;
  items: SliderTabItem[];
  linkState?: unknown;
};

function buildTabPath(basePath: string, pathSuffix: string) {
  return pathSuffix ? `${basePath}/${pathSuffix}` : basePath;
}

export default function SliderTabs({
  activePathSuffix,
  basePath,
  items,
  linkState,
}: SliderTabsProps) {
  const tabRefs = useRef<Array<HTMLAnchorElement | null>>([]);
  const [sliderStyle, setSliderStyle] = useState({ left: 0, width: 0 });

  useLayoutEffect(() => {
    const updateSlider = () => {
      const activeIndex = Math.max(
        0,
        items.findIndex((item) => item.pathSuffix === activePathSuffix)
      );
      const activeTab = tabRefs.current[activeIndex];

      if (!activeTab) return;

      setSliderStyle({
        left: activeTab.offsetLeft,
        width: activeTab.offsetWidth,
      });
    };

    updateSlider();
    window.addEventListener('resize', updateSlider);

    return () => {
      window.removeEventListener('resize', updateSlider);
    };
  }, [activePathSuffix, items]);

  return (
    <div className="w-full border-b border-[#E5E7EB] bg-white px-5 pt-3">
      <div className="w-full overflow-x-auto">
        <div className="min-w-[740px]">
          <div className="relative flex items-center gap-5">
            <div
              className="pointer-events-none absolute bottom-0 left-0 h-0.5 bg-[#008CEE] transition-transform duration-300 ease-out"
              style={{
                width: `${sliderStyle.width}px`,
                transform: `translateX(${sliderStyle.left}px)`,
              }}
            />

            {items.map((item, index) => {
              const isActive = item.pathSuffix === activePathSuffix;

              return (
                <Link
                  key={`${item.label}-${item.pathSuffix}`}
                  ref={(element) => {
                    tabRefs.current[index] = element;
                  }}
                  to={buildTabPath(basePath, item.pathSuffix)}
                  state={linkState}
                  aria-current={isActive ? 'page' : undefined}
                  className={[
                    'relative z-10 px-4 py-4 text-center leading-none transition-colors',
                    isActive
                      ? 'text-[#008CEE]'
                      : 'text-[#6B7280] hover:text-[#4B5563]',
                  ].join(' ')}
                >
                  <Text variant="subheading-regular" textColor="text-inherit">
                    {item.label}
                  </Text>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
