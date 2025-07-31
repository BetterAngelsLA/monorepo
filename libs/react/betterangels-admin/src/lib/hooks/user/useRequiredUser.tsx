import useUser from './useUser';

export default function useRequiredUser() {
  const { user } = useUser();

  if (!user) {
    throw new Error('User is required but was undefined.');
  }

  return user;
}
