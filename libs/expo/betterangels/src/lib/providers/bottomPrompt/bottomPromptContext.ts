import { createContext } from 'react';
import { BottomPromptContextValue } from './types';

export const BottomPromptContext =
  createContext<BottomPromptContextValue | null>(null);
