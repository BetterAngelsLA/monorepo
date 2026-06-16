import { useUpdateShelterProfile } from '../../../../../hooks/useUpdateShelterProfile';

type TProps = {
  photoId: string;
  shelterId: string;
  heroImageId?: string;
};

export function ToggleHeroShelterImageBtn(props: TProps) {
  const { photoId, shelterId, heroImageId } = props;
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

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      className={`text-xs font-medium px-2 py-1 rounded border ${
        isHero
          ? 'bg-green-100 text-green-700 border-green-400'
          : 'bg-white text-gray-500 border-gray-300 hover:border-green-400 hover:text-green-600'
      }`}
      aria-label={isHero ? 'Remove hero image' : 'Set as hero image'}
    >
      hero
    </button>
  );
}
