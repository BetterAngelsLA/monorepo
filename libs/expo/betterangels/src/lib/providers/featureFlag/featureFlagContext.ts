import { createContext, useContext } from "react";

export interface FeatureFlags {
    [key: string]: boolean;
}

export const FeatureFlagContext = createContext<FeatureFlags | undefined>(undefined);

export const useFeatureFlags = (): FeatureFlags => {
    const context = useContext(FeatureFlagContext);
    if (context === undefined) {
        throw new Error('useFeatureFlags must be used within a FeatureFlagProvider');
    }
    return context;
};
