import { useRouter } from 'expo-router';
import React, { createContext, ReactNode, useContext } from 'react';

type ShowScreenModalParams =
  | { route: string; params?: Record<string, any> } // For navigation-based modals
  | { content: ReactNode };                         // For direct overlays

interface ScreenModalContextType {
  showScreenModal: (args: ShowScreenModalParams) => void;
  hideScreenModal: () => void;
}

const ScreenModalContext = createContext<ScreenModalContextType | undefined>(undefined);

export function ScreenModalProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [overlayContent, setOverlayContent] = React.useState<ReactNode | null>(null);

  const showScreenModal = (args: ShowScreenModalParams) => {
    if ('route' in args) {
      // Use Expo Router for navigation-based modals
      router.push({ pathname: args.route, params: args.params });
    } else if ('content' in args) {
      // Render overlay directly
      setOverlayContent(args.content);
    }
  };

  const hideScreenModal = () => {
    setOverlayContent(null);
    router.back(); // Closes navigation-based modals
  };

  return (
    <ScreenModalContext.Provider value={{ showScreenModal, hideScreenModal }}>
      {children}
      {/* Simple overlay modal (optional) */}
      {overlayContent && (
        <YourOverlayModalComponent onClose={hideScreenModal}>
          {overlayContent}
        </YourOverlayModalComponent>
      )}
    </ScreenModalContext.Provider>
  );
}

export function useScreenModal() {
  const context = useContext(ScreenModalContext);
  if (!context) throw new Error('useScreenModal must be used within a ScreenModalProvider');
  return context;
}
