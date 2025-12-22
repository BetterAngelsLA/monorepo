import { Colors, Spacings } from '@monorepo/expo/shared/static';
import { SearchBar, TextRegular } from '@monorepo/expo/shared/ui-components';
import { useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { NoteType } from '../../../apollo';
import { pagePaddingHorizontal } from '../../../static';
import {
  CreateClientInteractionBtn,
  InteractionList,
  NoteCard,
} from '../../../ui-components';
import { ClientProfileQuery } from '../__generated__/Client.generated';

export default function Interactions({
  client,
}: {
  client: ClientProfileQuery | undefined;
}) {
  const [search, setSearch] = useState<string>('');

  const renderItemFn = useCallback(
    (note: NoteType) => <NoteCard note={note} variant="clientProfile" />,
    []
  );

  const renderListHeader = useCallback(
    (visible: number, total: number | undefined) => {
      if (!client) {
        return null;
      }

      return (
        <View style={styles.listHeader}>
          <TextRegular size="sm">
            Displaying {visible} of {total} interactions
          </TextRegular>

          <CreateClientInteractionBtn
            clientProfileId={client.clientProfile.id}
          />
        </View>
      );
    },
    [client]
  );

  if (!client) {
    return null;
  }

  return (
    <View style={styles.container}>
      <SearchBar
        value={search}
        placeholder="Search client interactions"
        onChange={(text) => setSearch(text)}
        onClear={() => setSearch('')}
        style={{ marginBottom: Spacings.xs }}
      />
      <InteractionList
        filters={{ search, clientProfile: client?.clientProfile.id }}
        renderHeader={renderListHeader}
        renderItem={renderItemFn}
        paginationLimit={10}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.NEUTRAL_EXTRA_LIGHT,
    paddingTop: Spacings.md,
    paddingHorizontal: pagePaddingHorizontal,
  },
  listHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacings.xs,
  },
});
