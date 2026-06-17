import { mergeCss } from '@monorepo/react/shared';
import { useUpdateShelterProfile } from '../../../../../../hooks/useUpdateShelterProfile';

type TProps = {
  photoId: string;
  shelterId: string;
  heroImageId?: string;
  className?: string;
  disabled?: boolean;
};

export function ToggleHeroShelterImageBtn(props: TProps) {
  const { photoId, shelterId, heroImageId, className, disabled } = props;

  const { updateShelter, loading } = useUpdateShelterProfile();

  const isHero = heroImageId === photoId;

  function handleClick() {
    updateShelter({
      variables: {
        data: {
          id: shelterId,
          heroImageId: isHero ? null : photoId,
        },
      },
    });
  }

  const btnCss = [
    'text-xs font-medium border border-transparent',
    'p-2 rounded-full',
    isHero
      ? 'bg-green-100 text-green-700 cursor-not-allowed'
      : 'bg-white text-gray-500 hover:text-green-600 hover:bg-white opacity-60 hover:opacity-100 hover:shadow-xl cursor-pointer',
    className,
  ];

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isHero || loading || disabled}
      className={mergeCss(btnCss)}
      aria-label="Set as hero image"
    >
      hero
    </button>
  );
}
