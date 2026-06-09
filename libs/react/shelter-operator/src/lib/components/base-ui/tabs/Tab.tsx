import { mergeCss } from '@monorepo/react/shared';
import { Text } from '../text/text';

type TabProps<T extends string | number> = {
  value: T;
  label: string;
  selected: boolean;
  onPress: (value: T) => void;
  tabRef?: (el: HTMLButtonElement | null) => void;
};

export function Tab<T extends string | number>({
  value,
  label,
  selected,
  onPress,
  tabRef,
}: TabProps<T>) {
  return (
    <button
      ref={tabRef}
      role="tab"
      type="button"
      onClick={() => onPress(value)}
      aria-selected={selected}
      className={mergeCss([
        'relative z-10 cursor-pointer px-4 py-4 text-center leading-none transition-colors',
        selected ? 'text-[#008CEE]' : 'text-[#6B7280] hover:text-[#4B5563]',
      ])}
    >
      <Text variant="subheading-regular" textColor="text-inherit">
        {label}
      </Text>
    </button>
  );
}
