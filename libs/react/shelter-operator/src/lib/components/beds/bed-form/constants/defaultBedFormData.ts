import { BedStatusChoices } from '../../../../apollo/graphql/__generated__/types';
import type { BedFormData } from '../formTypes';

/** Fresh copy of bed form defaults to avoid shared mutable state between renders. */
export const createEmptyBedFormData = (): BedFormData => ({
  accessibility: [],
  b7: false,
  demographics: [],
  fees: null,
  funders: [],
  maintenanceFlag: false,
  medicalNeeds: [],
  name: '',
  pets: [],
  roomId: null,
  status: BedStatusChoices.Available,
  statusNotes: '',
  storage: false,
  type: null,
});
