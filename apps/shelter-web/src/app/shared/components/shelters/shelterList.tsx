import { ShelterCard, TShelter } from './shelterCard';

type TShelterList = {
  className?: string;
  shelters: TShelter[];
};

export function ShelterList(props: TShelterList) {
  const { shelters, className = '' } = props;

  if (!shelters.length) {
    return null;
  }

  return (
    <div className={className}>
      {shelters.map((shelter, index) => {
        return (
          <ShelterCard
            key={index}
            className="mb-8 last:mb-0"
            shelter={shelter}
          />
        );
      })}
    </div>
  );
}
