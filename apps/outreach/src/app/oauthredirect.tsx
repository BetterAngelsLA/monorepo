import { router } from 'expo-router';
import { useEffect } from 'react';

export default function Page() {
  useEffect(() => {
    router.back();
  }, []);
}
