import type { RoomFormData } from '../formTypes';

/** Fresh copy of room form defaults to avoid shared mutable state between renders. */
export const createEmptyRoomFormData = (): RoomFormData => ({
  name: '',
  type: null,
  typeOther: '',
  notes: '',
  amenities: '',
  medicalRespite: false,
  demographics: [],
  accessibility: [],
  funders: [],
  pets: [],
  storage: false,
  maintenanceFlag: false,
});
