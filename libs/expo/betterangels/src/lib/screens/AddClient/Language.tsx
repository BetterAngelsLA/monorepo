import { Spacings } from '@monorepo/expo/shared/static';
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

  const enumDisplayMap: { [key in LanguageEnum]: string } = {
    [LanguageEnum.Arabic]: 'Arabic',
    [LanguageEnum.Armenian]: 'Armenian',
    [LanguageEnum.English]: 'English',
    [LanguageEnum.Farsi]: 'Farsi',
    [LanguageEnum.Indonesian]: 'Indonesian',
    [LanguageEnum.Japanese]: 'Japanese',
    [LanguageEnum.Khmer]: 'Khmer',
    [LanguageEnum.Korean]: 'Korean',
    [LanguageEnum.Russian]: 'Russian',
    [LanguageEnum.SimplifiedChinese]: 'Simplified Chinese',
    [LanguageEnum.Spanish]: 'Spanish',
    [LanguageEnum.Tagalog]: 'Tagalog',
    [LanguageEnum.TraditionalChinese]: 'Traditional Chinese',
    [LanguageEnum.Vietnamese]: 'Vietnamese',
  };

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
          onValueChange={(enumValue) =>
            setClient({
              ...client,
              preferredLanguage: enumValue as LanguageEnum,
            })
          }
          items={Object.entries(enumDisplayMap).map(
            ([enumValue, displayValue]) => ({
              displayValue: displayValue,
              value: enumValue,
            })
          )}
        />
      </View>
    </FieldCard>
  );
}
