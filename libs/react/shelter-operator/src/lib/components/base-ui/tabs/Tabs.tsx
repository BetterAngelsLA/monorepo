import { mergeCss } from '@monorepo/react/shared';
import { ReactNode, useLayoutEffect, useRef, useState } from 'react';
import { Tab } from './Tab';

type TabsProps<T extends string | number> = {
  tabs: readonly T[];
  selectedTab: T;
  onTabPress: (tab: T) => void;
  getLabel?: (tab: T) => string;
  className?: string;
  endContent?: ReactNode;
};

export function Tabs<T extends string | number>({
  tabs,
  selectedTab,
  onTabPress,
  getLabel = (t) => String(t),
  className,
  endContent,
}: TabsProps<T>) {
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const [sliderStyle, setSliderStyle] = useState({ left: 0, width: 0 });

  useLayoutEffect(() => {
    const updateSlider = () => {
      const activeIndex = Math.max(
        0,
        tabs.findIndex((tab) => tab === selectedTab)
      );
      const activeTab = tabRefs.current[activeIndex];

      if (!activeTab) {
        return;
      }

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
  }, [selectedTab, tabs]);

  return (
    <div
      className={mergeCss([
        'w-full border-b border-[#E5E7EB] bg-white px-5 pt-3',
        className,
      ])}
    >
      <div className="w-full overflow-x-auto">
        <div className="relative flex items-center gap-5">
          <div
            className="pointer-events-none absolute bottom-0 left-0 h-0.5 bg-[#008CEE] transition-transform duration-300 ease-out"
            style={{
              width: `${sliderStyle.width}px`,
              transform: `translateX(${sliderStyle.left}px)`,
            }}
          />

          {tabs.map((tab, index) => (
            <Tab
              key={String(tab)}
              tabRef={(el) => {
                tabRefs.current[index] = el;
              }}
              value={tab}
              label={getLabel(tab)}
              selected={tab === selectedTab}
              onPress={onTabPress}
            />
          ))}

          {endContent}
        </div>
      </div>
    </div>
  );
}
