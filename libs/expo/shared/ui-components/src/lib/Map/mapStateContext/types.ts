import { Dispatch, SetStateAction } from 'react';
import type { Region } from 'react-native-maps';
import { TMapDims } from '../types';

type TMapCoreState = {
  region: Region | null;
  dimensions: TMapDims | null;
};

export type TMapState<T> = TMapCoreState & T;

export type TMapStateCtx<T> = {
  state: TMapState<T>;
  setState: Dispatch<SetStateAction<TMapState<T>>>;
  reset: () => void;
  setMapDimensions: (dims: TMapDims) => void;
};
