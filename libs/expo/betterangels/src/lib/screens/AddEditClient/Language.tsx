import { Spacings } from '@monorepo/expo/shared/static';
import {
  FieldCard,
  Select,
  TextMedium,
} from '@monorepo/expo/shared/ui-components';
import { RefObject } from 'react';
import { useFormContext } from 'react-hook-form';
import { ScrollView, View } from 'react-native';
import {
  CreateClientProfileInput,
  LanguageEnum,
  UpdateClientProfileInput,
} from '../../apollo';
import { enumDisplayLanguage } from '../../static/enumDisplayMapping';

interface ILanguageProps {
  expanded: undefined | string | null;
  setExpanded: (expanded: undefined | string | null) => void;
  scrollRef: RefObject<ScrollView>;
}

export default function Language(props: ILanguageProps) {
  const { expanded, setExpanded, scrollRef } = props;
  const { setValue, watch } = useFormContext<
    UpdateClientProfileInput | CreateClientProfileInput
  >();

  const isLanguage = expanded === 'Language';
  const preferredLanguage = watch('preferredLanguage');
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
        !preferredLanguage && !isLanguage ? (
          <TextMedium size="sm">Add Language</TextMedium>
        ) : (
          <TextMedium textTransform="capitalize" size="sm">
            {preferredLanguage && enumDisplayLanguage[preferredLanguage]}
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
            setValue('preferredLanguage', enumValue as LanguageEnum)
          }
          items={Object.entries(enumDisplayLanguage).map(
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
