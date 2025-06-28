import { ReactNode, useState } from 'react';
import { InteractionsMapStateContext } from './InteractionsMapStateContext';
import { nullState } from './constants';
import { TInteractionsMapState } from './types';

type TProps = {
  children: ReactNode;
};

export function InteractionsMapStateProvider(props: TProps) {
  const { children } = props;

  const [mapState, setMapState] = useState<TInteractionsMapState>(nullState);

  const resetMapState = () => setMapState(nullState);

  return (
    <InteractionsMapStateContext.Provider
      value={{ mapState, setMapState, resetMapState }}
    >
      {children}
    </InteractionsMapStateContext.Provider>
  );
}
