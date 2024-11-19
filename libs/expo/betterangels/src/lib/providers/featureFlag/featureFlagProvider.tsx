import { useEffect, useMemo, useState } from "react";
import { gql, useQuery } from "@apollo/client";
import { FeatureFlagContext, FeatureFlags } from "./featureFlagContext";
import { View, Text } from "react-native";

const FEATURE_FLAGS_QUERY = gql`
    query GetFeatureFlags {
        featureControls {
            flags {
                name
                isActive
                lastModified
            }
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
        if (data && data.featureControls && data.featureControls.flags) {

            const flags = data.featureControls.flags.reduce(
                (acc: FeatureFlags, flag: { name: string; isActive: boolean }) => {
                    acc[flag.name] = flag.isActive;
                    return acc;
                }, {}
            );
            setFeatureFlags(flags);
        }
    }, [data]);

    const memoizedFlags = useMemo(() => featureFlags, [featureFlags]);

    if (loading) {
        return (
            <View>
                <Text>Loading...</Text>
            </View>
        );
    }

    if (error) {
        console.error("FeatureFlagProvider encountered an error:", error.message);
        return (
            <View>
                <Text>Something went wrong. Please try again later.</Text>
            </View>
        );
    }

    return (
        <FeatureFlagContext.Provider value={memoizedFlags}>
            {children}
        </FeatureFlagContext.Provider>
    );
};
