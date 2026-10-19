import { useFeatureControls } from './featureControlContext';

export function useFeatureSwitchActive(
  switchName: string,
  defaultValue = false,
): boolean {
  const context = useFeatureControls();
  const switchValue = context.switches[switchName]?.isActive;

  return switchValue !== undefined ? switchValue : defaultValue;
}
