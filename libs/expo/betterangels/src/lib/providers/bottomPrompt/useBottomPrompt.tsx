import { useContext } from 'react';
import { BottomPromptContext } from './bottomPromptContext';
import { BottomPromptContextValue } from './types';

export function useBottomPrompt(): BottomPromptContextValue {
  const ctx = useContext(BottomPromptContext);

  if (!ctx) {
    throw new Error('useBottomPrompt must be used within BottomPromptProvider');
  }

  return ctx;
}
