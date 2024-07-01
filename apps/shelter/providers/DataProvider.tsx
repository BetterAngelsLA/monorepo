import React, {
  Dispatch,
  ReactNode,
  createContext,
  useContext,
  useReducer,
} from 'react';
import { DATA } from './DATA';

interface DataItem {
  profileImageUrl: string;
  id: string;
  title: string;
  managingOrganization: string;
  location: {
    sPA: string;
    street: string;
    city: string;
    postalCode: string;
    confidential: boolean;
    latitude: string;
    longitude: string;
  };
  website: string;
  phone: string;
  email: string;
  description: {
    overview: string;
    layout: string;
    typicalStay: string;
    checkInTime: string;
  };
  services: string[];
  requirements: string[];
  population: string[];
  program: string[];
  beds: {
    total: number;
    private: number;
    rate: number;
    maxStayDays: number;
  };
  howtoEnter: string[];
  notes: {
    overview: string;
    methodOfBedCounting: string;
  };
}

export interface FiltersState {
  sPA: string[];
  population: string[];
  program: string[];
  services: string[];
  requirements: string[];
  notRequirements: string[];
}

interface State {
  data: DataItem[];
  filteredData: DataItem[];
  filters: FiltersState;
}

interface DataContextType {
  state: State;
  dispatch: Dispatch<any>;
  getLocation: (locationId: string) => DataItem | undefined;
}

const initialState: State = {
  data: DATA,
  filteredData: DATA,
  filters: {
    sPA: [],
    population: [],
    program: [],
    services: [],
    requirements: [],
    notRequirements: [],
  },
};

const DataContext = createContext<DataContextType>({
  state: initialState,
  dispatch: () => null,
  getLocation: () => undefined,
});

function dataReducer(
  state: State,
  action: { type: string; [key: string]: any }
) {
  switch (action.type) {
    case 'SET_FILTERS':
      return {
        ...state,
        filters: action.filters,
        filteredData: applyFilters(action.filters, state.data),
      };
    default:
      return state;
  }
}

const applyFilters = (filters: FiltersState, data: DataItem[]): DataItem[] => {
  return data.filter((item) => {
    if (filters.sPA.length > 0 && !filters.sPA.includes(item.location.sPA)) {
      return false;
    }

    if (
      filters.population.length > 0 &&
      !filters.population.every((population) =>
        item.population.includes(population)
      )
    ) {
      return false;
    }

    if (
      filters.program.length > 0 &&
      !filters.program.every((program) => item.program.includes(program))
    ) {
      return false;
    }

    if (
      filters.services.length > 0 &&
      !filters.services.every((service) => item.services.includes(service))
    ) {
      return false;
    }

    if (
      filters.requirements.length > 0 &&
      !filters.requirements.every((requirement) =>
        item.requirements.includes(requirement)
      )
    ) {
      return false;
    }

    if (
      filters.notRequirements.length > 0 &&
      filters.notRequirements.some((notRequirement) =>
        item.requirements.includes(notRequirement)
      )
    ) {
      return false;
    }

    return true;
  });
};

interface DataProviderProps {
  children: ReactNode;
}

export const DataProvider = ({ children }: DataProviderProps) => {
  const [state, dispatch] = useReducer(dataReducer, initialState);

  const getLocation = (locationId: string) => {
    return state.data.find((location) => location.id === locationId);
  };

  const contextValue = {
    state,
    dispatch,
    getLocation,
  };

  return (
    <DataContext.Provider value={contextValue}>{children}</DataContext.Provider>
  );
};

export const useData = () => useContext(DataContext);
