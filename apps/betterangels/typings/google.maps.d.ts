import '@types/google.maps';

declare global {
  namespace google {
    export const maps: typeof google.maps;
  }
}
