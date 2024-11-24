import { useEffect, useMemo, useState } from "react";
import { FeatureFlagContext, FeatureFlags } from "./featureFlagContext";
import { useGetFeatureFlagsQuery } from "./__generated__/queries.generated";


interface FeatureFlagProviderProps {
    children: React.ReactNode;
}

export const FeatureFlagProvider: React.FC<FeatureFlagProviderProps> = ({ children }) => {
    const [featureFlags, setFeatureFlags] = useState<FeatureFlags>({});
    const { data, loading, error } = useGetFeatureFlagsQuery();

    useEffect(() => {
        if (data?.featureControls?.flags) {
            const flags = data.featureControls.flags.reduce((acc: FeatureFlags, flag) => {
                acc[flag.name] = flag.isActive ?? false;
                return acc;
            }, {});
            setFeatureFlags(flags);
        }
    }, [data]);

    const memoizedFlags = useMemo(() => featureFlags, [featureFlags]);

    if (loading) {
        return <Text>Loading...</Text>
    }

    if (error) {
        return <Text>Error loading feature flags</Text>
    }

    return (
        <FeatureFlagContext.Provider value={memoizedFlags}>
            {children}
        </FeatureFlagContext.Provider>
    );
};
