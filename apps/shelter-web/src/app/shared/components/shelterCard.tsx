export type TShelter = {
  name: string;
  address: string;
  heroUrl?: string | null;
  distance?: number | null;
};

type TShelterCard = {
  className?: string;
  shelter: TShelter;
};

export function ShelterCard(props: TShelterCard) {
  const {
    shelter: { name, address, heroUrl, distance },
    className = '',
  } = props;

  const cardCss = [className].join(' ');

  return (
    <div className={cardCss}>
      {!!heroUrl && (
        <div className="mb-2">
          <div></div>
          <div></div>
        </div>
      )}

      <div className="font-bold">{name}</div>

      {!!address && (
        <div className="flex items-center mt-2">
          <div>{address}</div>

          {!!distance && <div>({distance}) miles away</div>}
        </div>
      )}
    </div>
  );
}
