// PrintContext.tsx
import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useState,
} from 'react';

interface PrintContextType {
  isPrinting: boolean;
  setPrinting: (value: boolean) => void;
}

const PrintContext = createContext<PrintContextType | undefined>(undefined);

export function PrintProvider({ children }: { children: ReactNode }) {
  const [isPrinting, setIsPrinting] = useState(false);

  const setPrinting = useCallback((value: boolean) => {
    setIsPrinting(value);
  }, []);

  return (
    <PrintContext.Provider value={{ isPrinting, setPrinting }}>
      {children}
    </PrintContext.Provider>
  );
}

export function usePrint() {
  const context = useContext(PrintContext);
  if (!context) {
    throw new Error('usePrint must be used within a PrintProvider');
  }
  return context;
}
