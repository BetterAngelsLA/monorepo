import { mergeCss } from '@monorepo/react/shared';
import { useUpdateShelterProfile } from '../../../../../../hooks/useUpdateShelterProfile';
import { useToast } from '../../../../../base-ui/toast';

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
  const { showToast } = useToast();

  const isHero = heroImageId === photoId;

  async function handleClick() {
    try {
      await updateShelter({
        variables: {
          data: {
            id: shelterId,
            heroImageId: isHero ? null : photoId,
          },
        },
      });

      showToast({
        status: 'success',
        title: 'Hero status updted.',
      });
    } catch (e) {
      console.error(`[updateShelter heroImage error]: ${e}.`);

      showToast({
        status: 'error',
        title: 'Update failed',
        description: 'Sorry, an unexpected error occurred.',
      });
    }
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
