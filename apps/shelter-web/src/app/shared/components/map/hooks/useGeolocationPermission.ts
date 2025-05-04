import { useEffect, useState } from 'react';

export function useGeolocationPermission(): PermissionState | null {
  const [permission, setPermission] = useState<PermissionState | null>(null);

  useEffect(() => {
    let permissionStatus: PermissionStatus;
    const permissionQuery = navigator.permissions;

    if (!permissionQuery) {
      return;
    }

    permissionQuery
      .query({ name: 'geolocation' as PermissionName })
      .then((result) => {
        setPermission(result.state);
        permissionStatus = result;

        result.onchange = () => {
          setPermission(result.state);
        };
      })
      .catch((e) => {
        console.error(`[useGeolocationPermission]: ${e}`);
      });

    return () => {
      if (permissionStatus) {
        permissionStatus.onchange = null;
      }
    };
  }, []);

  return permission;
}
