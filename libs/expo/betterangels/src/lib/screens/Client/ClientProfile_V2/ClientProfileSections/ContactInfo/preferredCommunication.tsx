import { PreferredCommunicationEnum } from 'libs/expo/betterangels/src/lib/apollo';
import { enumDisplayPreferredCommunication } from 'libs/expo/betterangels/src/lib/static';

type TProps = {
  communications: PreferredCommunicationEnum[] | null | undefined;
};

export function getPreferredCommunicationRow(props: TProps) {
  const { communications } = props;

  if (!communications?.length) {
    return [];
  }

  const pfs = communications
    .map((pf) => enumDisplayPreferredCommunication[pf])
    .join(', ');

  return [pfs];
}
