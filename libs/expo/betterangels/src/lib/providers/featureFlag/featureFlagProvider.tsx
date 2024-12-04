import { useEffect, useMemo, useState } from "react";
import { FeatureFlagContext, FeatureFlags } from "./featureFlagContext";
import { View, Text } from "react-native";
import { useGetFeatureFlagsQuery } from "./__generated__/featureFlagProvider.generated"


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
                }, {}
            );
            setFeatureFlags(flags);
            console.log(data)
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
