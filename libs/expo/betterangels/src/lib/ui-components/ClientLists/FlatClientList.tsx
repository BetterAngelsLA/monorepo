import { Colors, Spacings } from '@monorepo/expo/shared/static';
import { TextBold, TextMedium } from '@monorepo/expo/shared/ui-components';
import { ReactElement } from 'react';
import { FlatList, View } from 'react-native';
import { TFullClientProfile } from '../../apollo/graphql/types/clientProfile';
import ClientListCard from './ClientListCard';

export type TFlatClientList = {
  title: string;
  clients: TFullClientProfile[];
  totalCount?: number;
  arrivedFrom?: string;
  onClick?: () => void;
  onEndReached?: () => void;
  onEndReachedThreshold?: number;
  footer?: ReactElement;
  header?: ReactElement;
};

export function FlatClientList(props: TFlatClientList) {
  const {
    arrivedFrom = '/',
    clients,
    title,
    totalCount,
    onClick,
    onEndReached,
    onEndReachedThreshold = 0.05, // ?
    header,
    footer,
  } = props;

  return (
    <View style={{ flex: 1 }}>
      {/* <Header title="Clients" Logo={Logo} /> */}
      <View
        style={{
          flex: 1,
          backgroundColor: Colors.NEUTRAL_EXTRA_LIGHT,
          paddingHorizontal: Spacings.sm,
          paddingTop: Spacings.sm,
        }}
      >
        {title && (
          <TextBold mb="sm" size="lg">
            {title}
          </TextBold>
        )}
        {/* TODO: extract */}
        {/* <BasicInput
          icon={<SearchIcon ml="sm" color={Colors.NEUTRAL} />}
          value={search}
          placeholder="Search by name"
          autoCorrect={false}
          onChangeText={onChange}
          onDelete={() => {
            setSearch('');
            setFilterSearch('');
            setOffset(0);
            setClients([]);
          }}
        /> */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginTop: Spacings.xs,
            backgroundColor: Colors.NEUTRAL_EXTRA_LIGHT,
          }}
        >
          <TextMedium size="sm">
            Displaying {clients.length} of {totalCount} clients
          </TextMedium>
        </View>
        {!!clients.length && (
          <FlatList
            style={{
              flex: 1,
              backgroundColor: Colors.NEUTRAL_EXTRA_LIGHT,
              paddingBottom: 80,
              marginTop: Spacings.xs,
            }}
            data={clients}
            renderItem={({ item }) => (
              <ClientListCard
                client={item}
                arrivedFrom={arrivedFrom}
                // select={select as string} // Clarify
                onPress={onClick}
                mb="sm"
              />
            )}
            keyExtractor={(clientProfile) => clientProfile.id}
            onEndReached={onEndReached}
            onEndReachedThreshold={onEndReachedThreshold}
            ListHeaderComponent={header}
            ListFooterComponent={footer}
          />
        )}
      </View>
    </View>
  );
}
