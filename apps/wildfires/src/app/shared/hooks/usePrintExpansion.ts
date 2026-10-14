import { useCallback, useState } from 'react';
import { usePrint } from '../providers/PrintProvider';

export function usePrintExpansion() {
  const [show, setShow] = useState(false);
  const { isPrinting } = usePrint();

  const handleToggle = useCallback(() => {
    setShow((prev) => !prev);
  }, []);

  // Printing forces content open without overwriting the user's expansion state.
  return { isOpen: isPrinting || show, handleToggle };
}
