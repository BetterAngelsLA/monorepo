import {
  Interactions,
  InteractionsHmis,
  useUser,
} from '@monorepo/expo/betterangels';
import Logo from '../assets/images/logo.svg';

export default function InteractionsScreen() {
  const { isHmisUser } = useUser();

  return isHmisUser ? (
    <InteractionsHmis Logo={Logo} />
  ) : (
    <Interactions Logo={Logo} />
  );
}
