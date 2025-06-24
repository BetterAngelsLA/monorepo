import {
  FunctionComponent,
  PropsWithChildren,
  createContext,
  useCallback,
  useContext,
  useState,
} from 'react';
import { TMapDims } from '../types';
import { TMapState, TMapStateCtx } from './types';

export function createMapStateContext<T>(displayName: string = 'MapState') {
  type TState = TMapState<T>;

  const Ctx = createContext<TMapStateCtx<T> | null>(null);

  type TProviderProps = PropsWithChildren<{
    initial?: Partial<TState>;
  }>;

  const Provider: FunctionComponent<TProviderProps> = ({
    initial,
    children,
  }) => {
    const [state, setState] = useState<TState>(
      () =>
        ({
          region: null,
          dimensions: null,
          ...initial,
        } as TState)
    );

    const reset = () => setState((s) => ({ ...s, region: null }));

    const setMapDimensions = useCallback((dims: TMapDims) => {
      const { width: newW, height: newH } = dims;

      const dimsDiffThreshold = 0.01;

      setState((prev) => {
        const { width: prevW, height: prevH } = prev.dimensions || {};

        const noChange =
          prevW &&
          prevH &&
          Math.abs(prevW - newW) < dimsDiffThreshold &&
          Math.abs(prevH - newH) < dimsDiffThreshold;

        return noChange ? prev : { ...prev, dimensions: dims };
      });
    }, []);

    return (
      <Ctx.Provider value={{ state, setState, reset, setMapDimensions }}>
        {children}
      </Ctx.Provider>
    );
  };

  const useMapState = () => {
    const ctx = useContext(Ctx);

    if (!ctx) {
      throw new Error(`${displayName}Provider missing`);
    }

    return ctx;
  };

  return { Provider, useMapState };
}
