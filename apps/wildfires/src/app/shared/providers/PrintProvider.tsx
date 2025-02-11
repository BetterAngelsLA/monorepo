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

interface PrintProviderProps {
  children: ReactNode;
  initialIsPrinting?: boolean; // Optional prop for an initial value
}

export function PrintProvider({
  children,
  initialIsPrinting = false, // default to false if not provided
}: PrintProviderProps) {
  const [isPrinting, setIsPrinting] = useState(initialIsPrinting);

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
