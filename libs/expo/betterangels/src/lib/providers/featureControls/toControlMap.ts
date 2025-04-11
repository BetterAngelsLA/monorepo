import {
  TControlInput,
  TFeatureControlGroup,
  TFeatureControlMapKey,
} from './types';

export const nullFeatureControlGroup: TFeatureControlGroup = {
  flags: {},
  switches: {},
  samples: {},
};

export function toControlMap(controls: TControlInput[]) {
  return controls.reduce((map, control) => {
    map[control.name as TFeatureControlMapKey] = {
      isActive: !!control.isActive,
      lastModified: control.lastModified,
    };

    return map;
  }, nullFeatureControlGroup);
}
