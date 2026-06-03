import { BedStatusChoices } from '../../../../apollo/graphql/__generated__/types';
import type { BedFormData } from '../formTypes';

/** Fresh copy of bed form defaults to avoid shared mutable state between renders. */
export const createEmptyBedFormData = (): BedFormData => ({
  name: '',
  roomId: null,
  status: BedStatusChoices.Available,
  statusNotes: '',
  type: null,
  demographics: [],
  accessibility: [],
  funders: [],
  pets: [],
  storage: false,
  maintenanceFlag: false,
  b7: false,
  fees: null,
  medicalNeeds: [],
});
