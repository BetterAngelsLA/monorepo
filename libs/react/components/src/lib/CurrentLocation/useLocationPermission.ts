import { useEffect, useState } from 'react';

/**
 * Reactively tracks whether the user has granted geolocation permission
 * using the browser Permissions API. Automatically updates when the
 * permission state changes (e.g. user grants/revokes in browser settings).
 *
 * @returns `true` if geolocation permission is granted, `false` otherwise.
 */
export function useLocationPermission(): boolean {
  const [granted, setGranted] = useState(false);

  useEffect(() => {
    if (typeof navigator === 'undefined' || !navigator.permissions) {
      return;
    }

    let status: PermissionStatus | null = null;

    const onChange = () => {
      if (status) {
        setGranted(status.state === 'granted');
      }
    };

    navigator.permissions.query({ name: 'geolocation' }).then((result) => {
      status = result;
      setGranted(result.state === 'granted');
      result.addEventListener('change', onChange);
    });

    return () => {
      status?.removeEventListener('change', onChange);
    };
  }, []);

  return granted;
}
