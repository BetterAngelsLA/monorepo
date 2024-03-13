import React from 'react';
import { FlatList, SafeAreaView, StyleSheet } from 'react-native';
import LocationPreview from '../../components/LocationPreview';
import { useData } from '../../providers/DataProvider';

const LocationListScreen = () => {
  const { state } = useData();
  const { filteredData } = state;

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={filteredData}
        renderItem={({ item }) => (
          <LocationPreview
            id={item.id}
            title={item.title}
            profileImageUrl={item.profileImageUrl}
            location={item.location}
            program={item.program}
            population={item.population}
            services={item.services}
            // requirements={item.requirements}
          />
        )}
        keyExtractor={(item) => item.id}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default LocationListScreen;
