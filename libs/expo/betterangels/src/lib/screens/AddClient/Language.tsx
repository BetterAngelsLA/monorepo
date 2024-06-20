import { Languages, Spacings } from '@monorepo/expo/shared/static';
import {
  FieldCard,
  Select,
  TextMedium,
} from '@monorepo/expo/shared/ui-components';
import { RefObject } from 'react';
import { ScrollView, View } from 'react-native';
import { CreateClientProfileInput, LanguageEnum } from '../../apollo';

interface ILanguageProps {
  client: CreateClientProfileInput;
  setClient: (client: CreateClientProfileInput) => void;
  expanded: undefined | string | null;
  setExpanded: (expanded: undefined | string | null) => void;
  scrollRef: RefObject<ScrollView>;
}

export default function Language(props: ILanguageProps) {
  const { expanded, setExpanded, client, setClient, scrollRef } = props;

  const isLanguage = expanded === 'Language';
  return (
    <FieldCard
      scrollRef={scrollRef}
      overflow={isLanguage ? 'visible' : 'hidden'}
      expanded={expanded}
      setExpanded={() => {
        setExpanded(isLanguage ? null : 'Language');
      }}
      mb="xs"
      actionName={
        !client.preferredLanguage && !isLanguage ? (
          <TextMedium size="sm">Add Language</TextMedium>
        ) : (
          <TextMedium textTransform="capitalize" size="sm">
            {client.preferredLanguage}
          </TextMedium>
        )
      }
      title="Language"
    >
      <View
        style={{
          gap: Spacings.sm,
          height: isLanguage ? 'auto' : 0,
          overflow: isLanguage ? 'visible' : 'hidden',
        }}
      >
        <Select
          placeholder="Select Language"
          value={client.preferredLanguage || ''}
          onChange={(e) =>
            setClient({
              ...client,
              preferredLanguage: e as LanguageEnum,
            })
          }
          data={Languages}
        />
      </View>
    </FieldCard>
  );
}
