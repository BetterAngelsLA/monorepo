import { useEffect, useMemo, useState } from "react";
import { gql, useQuery } from "@apollo/client";
import { FeatureFlagContext, FeatureFlags } from "./featureFlagContext";

const FEATURE_FLAGS_QUERY = gql`
    query GetFeatureFlags {
        featureFlags {
            key
            enabled
        }
    }
`;

interface FeatureFlagProviderProps {
    children: React.ReactNode;
}

export const FeatureFlagProvider: React.FC<FeatureFlagProviderProps> = ({ children }) => {
    const [featureFlags, setFeatureFlags] = useState<FeatureFlags>({});
    const { data, loading, error } = useQuery(FEATURE_FLAGS_QUERY);

    useEffect(() => {
        if (data) {
            const flags = data.featureFlags.reduce((acc: FeatureFlags, flag: { key: string; enabled: boolean }) => {
                acc[flag.key] = flag.enabled;
                return acc;
            }, {});
            setFeatureFlags(flags);
        }
    }, [data]);

    const memoizedFlags = useMemo(() => featureFlags, [featureFlags]);

    if (loading) {
        return <div>Loading...</div>;
    }

    if (error) {
        return <div>Error</div>
    }

    return (
        <FeatureFlagContext.Provider value={memoizedFlags}>
            {children}
        </FeatureFlagContext.Provider>
    );
};
