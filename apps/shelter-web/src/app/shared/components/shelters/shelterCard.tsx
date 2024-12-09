const fallbackImgUrl =
  'https://fastly.picsum.photos/id/649/800/800.jpg?hmac=rl1sdkgulWbrfyz-7hM8yyP5hsBHjC8IJmFC04XmvJM';

export type TShelter = {
  id: string;
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
    shelter: { name, heroUrl },
    className = '',
  } = props;

  const cardCss = [className].join(' ');

  return (
    <div className={cardCss}>
      <div className="mb-4">
        <img
          src={heroUrl || fallbackImgUrl}
          alt={`hero image for ${name}`}
          loading="lazy"
          className="aspect-[4/3] rounded-[20px]"
        />
      </div>

      <div className="font-semibold text-sm leading-[1.125rem] tracking-[.03125rem]">
        {name}
      </div>
    </div>
  );
}
