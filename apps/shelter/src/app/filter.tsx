import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import { Platform, SafeAreaView, ScrollView, StyleSheet } from 'react-native';

import ChipGroup from '../../components/ChipGroup';
import RequirementRow from '../../components/RequirementRow';
import Separator from '../../components/Separator';
import { View } from '../../components/Themed';
import ToggleRow from '../../components/ToggleRow';

import { Colors, Spacings } from '@monorepo/expo/shared/static';
import { Button, TextBold } from '@monorepo/expo/shared/ui-components';
import BottomOptions from '../../components/BottomOptions';

import { router } from 'expo-router';
import { FiltersState, useData } from '../../providers/DataProvider';

export default function FiltetrScreen() {
  const { dispatch } = useData();

  const [filters, setFilters] = useState<FiltersState>({
    sPA: [],
    population: [],
    program: [],
    services: [],
    requirements: [],
    notRequirements: [],
  });

  const toggleSPAValues = [
    { value: '1', title: 'SPA 1 - Antelope Valley' },
    { value: '2', title: 'SPA 2 - San Fernando Valley' },
    { value: '3', title: 'SPA 3 - San Gabriel Valley' },
    { value: '4', title: 'SPA 4 - Metro LA' },
    { value: '5', title: 'SPA 5 - West' },
    { value: '6', title: 'SPA 6 - South' },
    { value: '7', title: 'SPA 7 - East' },
    { value: '8', title: 'SPA 8 - South Bay' },
  ];

  const togglePopulationValues = [
    { value: 'Adults' },
    { value: 'Men' },
    { value: 'Women' },
    { value: 'Families' },
    { value: 'Youth (TAY)' },
    { value: 'Boys' },
    { value: 'Girls' },
    { value: 'Seniors (55+)' },
    { value: 'Veterans' },
    { value: 'LGBTQ+' },
    { value: 'HIV/AIDS' },
  ];

  const toggleProgramValues = [
    { iconName: 'home', value: 'Interim Housing' },
    { iconName: 'lock', value: 'Permanent Housing' },
    { iconName: 'building', value: 'A Bridge Home (ABH)' },
    { iconName: 'key', value: 'Project Homekey (PHK)' },
    { iconName: 'home', value: 'Project Roomkey (PRK)' },
    { iconName: 'th-large', value: 'Tiny Home Village' },
    { iconName: 'snowflake-o', value: 'Winter Shelter' },
    { iconName: 'bed', value: 'Emergency Shelter' },
    { iconName: 'exclamation-triangle', value: 'Crisis Housing' },
    { iconName: 'heartbeat', value: 'Recuperative Care' },
    { iconName: 'exchange', value: 'Transitional Housing' },
    { iconName: 'map', value: 'Roadmap Home' },
    { iconName: 'bolt', value: 'Rapid Re-housing' },
    { iconName: 'leaf', value: 'Sober Living' },
  ];

  const servicesChipData = [
    { iconName: 'cutlery', value: 'Food' },
    { iconName: 'shower', value: 'Showers' },
    { iconName: 'shopping-bag', value: 'Clothing' },
    { iconName: 'phone', value: 'Phone' },
    { iconName: 'laptop', value: 'Computers' },
    { iconName: 'briefcase', value: 'Job Training' },
    { iconName: 'book', value: 'Tutoring' },
    { iconName: 'graduation-cap', value: 'Life Skills Training' },
    { iconName: 'medkit', value: 'Medical Services' },
    { iconName: 'heartbeat', value: 'Mental Health' },
    { iconName: 'shield', value: 'Harm Reduction' },
    { iconName: 'suitcase', value: 'Case Management' },
    { iconName: 'home', value: 'Housing Navigation' },
    { iconName: 'user-md', value: 'Substance Abuse Treatment' },
    { iconName: 'money', value: 'Money Management' },
    { iconName: 'gavel', value: 'Legal Assistance' },
    { iconName: 'car', value: 'Rides' },
  ];

  const requirementData = [
    { iconName: 'id-card', value: 'Photo I.D.' },
    { iconName: 'medkit', value: 'Medicaid or Medicare' },
    { iconName: 'wheelchair', value: 'Wheelchair Accessible' },
    { iconName: 'heart-o', value: 'Medical Equipment Permitted' },
    { iconName: 'paw', value: 'Pets Allowed' },
    { iconName: 'calendar-check-o', value: 'Reservation' },
    { iconName: 'handshake-o', value: 'Referral Needed' },
  ];

  const handleToggleChange = (
    value: string[],
    category: keyof FiltersState
  ) => {
    setFilters((prev) => ({ ...prev, [category]: value }));
  };

  const handleRequirementChange = (value: string, selection: string) => {
    setFilters((prev) => {
      let newRequirements = [...prev.requirements];
      let newNotRequirements = [...prev.notRequirements];

      if (selection === 'Required') {
        newRequirements = newRequirements.includes(value)
          ? newRequirements
          : [...newRequirements, value];
        newNotRequirements = newNotRequirements.filter(
          (item) => item !== value
        );
      } else if (selection === 'Not Required') {
        newNotRequirements = newNotRequirements.includes(value)
          ? newNotRequirements
          : [...newNotRequirements, value];
        newRequirements = newRequirements.filter((item) => item !== value);
      } else {
        // Handle "Show Both"
        newRequirements = newRequirements.filter((item) => item !== value);
        newNotRequirements = newNotRequirements.filter(
          (item) => item !== value
        );
      }

      return {
        ...prev,
        requirements: newRequirements,
        notRequirements: newNotRequirements,
      };
    });
  };

  const findMatch = () => {
    console.log('Find Match Pressed');
    console.log(filters);
    dispatch({ type: 'SET_FILTERS', filters: filters });
    router.back();
  };

  return (
    <SafeAreaView style={styles.safeContainer}>
      <StatusBar style={Platform.OS === 'ios' ? 'light' : 'auto'} />
      <View style={styles.screenContainer}>
        <ScrollView>
          <View style={styles.filterContainer}>
            <TextBold size="xl" mb="md">
              Shelter Filters
            </TextBold>
            <TextBold mb="sm">SPA</TextBold>
            <ToggleRow
              togglesData={toggleSPAValues}
              onSelectionChange={(values) => handleToggleChange(values, 'sPA')}
            />

            <Separator />
            <TextBold mb="sm">Population</TextBold>
            <ToggleRow
              togglesData={togglePopulationValues}
              onSelectionChange={(values) =>
                handleToggleChange(values, 'population')
              }
            />

            <Separator />
            <TextBold mb="sm">Program</TextBold>
            <ToggleRow
              togglesData={toggleProgramValues}
              onSelectionChange={(values) =>
                handleToggleChange(values, 'program')
              }
            />

            <Separator />
            <TextBold mb="sm">Services</TextBold>
            <ChipGroup
              chipsData={servicesChipData}
              onSelectionChange={(values) =>
                handleToggleChange(values, 'services')
              }
            />

            <Separator />
            <TextBold mb="sm">Requirements</TextBold>
            <RequirementRow
              requirementsData={requirementData}
              onSelectionChange={(value, isSelected) =>
                handleRequirementChange(value, isSelected)
              }
            />
          </View>
        </ScrollView>
        <BottomOptions justifyContent="space-around">
          <Button
            accessibilityLabel="Apply filters and find match"
            accessibilityHint="goes to list view"
            onPress={findMatch}
            mb="sm"
            mt="sm"
            size="full"
            title="Find Match"
            variant="primary"
          />
        </BottomOptions>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
  },
  screenContainer: {
    flex: 1,
  },
  filterContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: Spacings.sm,
    paddingTop: Spacings.md,
    backgroundColor: Colors.WHITE,
  },
});
