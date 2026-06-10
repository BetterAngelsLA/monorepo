import { RoomStatusChoices } from '../../../../apollo/graphql/__generated__/types';
import type { RoomFormData } from '../formTypes';

/** Fresh copy of room form defaults to avoid shared mutable state between renders. */
export const createEmptyRoomFormData = (): RoomFormData => ({
  name: '',
  status: RoomStatusChoices.Available,
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
