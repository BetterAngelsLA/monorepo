import { useShelter } from '../../../hooks/useShelter';

type TProps = {
  shelterId: string;
};

export function BasicInfo(props: TProps) {
  const { shelterId } = props;

  const { shelter } = useShelter(shelterId);

  console.log(shelter);

  return <div className="px-6">Basic Info x</div>;
}
