import { useEffect, useMemo, useState } from "react";
import { FeatureFlagContext, FeatureFlags } from "./featureFlagContext";
import { useGetFeatureFlagsQuery } from "./__generated__/featureFlagProvider.generated"


interface FeatureFlagProviderProps {
    children: React.ReactNode;
}

export const FeatureFlagProvider: React.FC<FeatureFlagProviderProps> = ({ children }) => {
    const [featureFlags, setFeatureFlags] = useState<FeatureFlags>({});
    const { data, error } = useGetFeatureFlagsQuery();

    useEffect(() => {
        if (data?.featureControls?.flags) {
            const flags = data.featureControls.flags.reduce((acc: FeatureFlags, flag) => {
                acc[flag.name] = flag.isActive ?? false;
                    return acc;
                }, {}
            );
            setFeatureFlags(flags);
        }
    }, [data]);

    const memoizedFlags = useMemo(() => featureFlags, [featureFlags]);

    if (error) {
        console.error("FeatureFlagProvider encountered an error:", error.message);
    }

    return (
        <FeatureFlagContext.Provider value={memoizedFlags}>
            {children}
        </FeatureFlagContext.Provider>
    );
};
