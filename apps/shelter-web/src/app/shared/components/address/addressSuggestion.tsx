import LocationIcon from '@assets/icons/locationIcon.svg?react';

type TAddressOption = {
  className?: string;
  item: google.maps.places.AutocompletePrediction;
  onClick: () => void;
};

export function AddressSuggestion(props: TAddressOption) {
  const { className, item, onClick } = props;

  const {
    description,
    structured_formatting: { main_text, secondary_text },
  } = item;

  let primaryText = main_text;
  const secondaryText = secondary_text.replace(/, USA$/, '');

  if (!secondaryText) {
    primaryText = description;
  }

  const parentCss = [
    className,
    'py-2',
    'pr-4',
    'flex',
    'items-center',
    'rounded-lg',
    'text-sm',
    'leading-5',
    'cursor-pointer',
    'hover:bg-neutral-98',
    'active:bg-neutral-98',
  ].join(' ');

  return (
    <div className={parentCss} onClick={onClick}>
      <div className="mr-2 p-4 bg-neutral-98 rounded-lg">
        <LocationIcon className="w-2 h-2" />
      </div>
      <div className="flex flex-col">
        <div className="font-semibold">{primaryText}</div>
        <div>{secondaryText}</div>
      </div>
    </div>
  );
}
