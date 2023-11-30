import {
  Image,
  Pressable,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';

import { MainScrollContainer } from '@monorepo/expo/betterangels';
import { BarsIcon, BellIcon, SearchIcon } from '@monorepo/expo/shared/icons';
import { Colors, Spacings } from '@monorepo/expo/shared/static';
import {
  BodyText,
  H1,
  H4,
  SearchableDropdown,
} from '@monorepo/expo/shared/ui-components';
import { useNavigation, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';

interface ITeam {
  id: string;
  title: string;
}

const TEAMS: ITeam[] = [
  {
    id: '1',
    title: 'Clinical',
  },
  {
    id: '2',
    title: 'Compliance',
  },
  {
    id: '3',
    title: 'E6 Outreach',
  },
];

export default function TeamsScreen() {
  const navigation = useNavigation();
  const router = useRouter();

  const [, setSelectedTeam] = useState<string | undefined>();
  const [teams] = useState<Array<ITeam> | null>(TEAMS);

  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <View style={styles.headerContainer}>
          <Pressable>
            <SearchIcon color={Colors.PRIMARY_EXTRA_DARK} />
          </Pressable>
          <Pressable style={{ marginHorizontal: Spacings.md }}>
            <BellIcon color={Colors.PRIMARY_EXTRA_DARK} />
          </Pressable>
          <Pressable>
            <BarsIcon color={Colors.PRIMARY_EXTRA_DARK} />
          </Pressable>
        </View>
      ),
    });
  }, [navigation]);

  return (
    <MainScrollContainer>
      <H1 mb="sm">Teams</H1>
      <BodyText mb="md" size="sm">
        Add your team names in order to build your teams.
      </BodyText>
      <SearchableDropdown
        mb="lg"
        setExternalValue={setSelectedTeam}
        data={['Clinical', 'Compliance', 'E6 Outreach']}
        placeholder="Enter team name"
        label="Team Name"
      />
      <H4>Teams List</H4>

      {teams && teams.length < 1 ? (
        <View style={{ alignItems: 'center' }}>
          <Image
            height={200}
            width={200}
            source={require('../assets/images/no-teams.png')}
          />
          <H4 style={{ maxWidth: 265 }} align="center" mt="md" spacing={0.5}>
            No teams have been added yet. Let’s start building your team!
          </H4>
        </View>
      ) : (
        teams?.map((team, idx) => (
          <TouchableOpacity
            onPress={() => router.push(`/team/${team.id}`)}
            style={{ padding: Spacings.sm, marginTop: Spacings.md }}
            key={idx}
          >
            <BodyText>{team.title}</BodyText>
          </TouchableOpacity>
        ))
      )}
    </MainScrollContainer>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: Spacings.md,
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
