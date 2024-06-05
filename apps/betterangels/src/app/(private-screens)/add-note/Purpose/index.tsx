import { ViewNoteQuery } from '@monorepo/expo/betterangels';
import { CircleSolidIcon } from '@monorepo/expo/shared/icons';
import { Colors, Spacings } from '@monorepo/expo/shared/static';
import {
  FieldCard,
  TextMedium,
  TextRegular,
} from '@monorepo/expo/shared/ui-components';
import { RefObject, useEffect, useState } from 'react';
import { ScrollView, View } from 'react-native';
import PurposeInput from './PurposeInput';

interface IPurposeProps {
  expanded: string | undefined | null;
  setExpanded: (expanded: string | undefined | null) => void;
  noteId: string | undefined;
  purposes: ViewNoteQuery['note']['purposes'];
  scrollRef: RefObject<ScrollView>;
}

export default function Purpose(props: IPurposeProps) {
  const {
    expanded,
    setExpanded,
    noteId,
    purposes: initialPurposes,
    scrollRef,
  } = props;

  const [purposes, setPurposes] = useState<
    | Array<{
        id: string | undefined;
        value: string;
      }>
    | undefined
  >(undefined);
  const [hasError, setHasError] = useState({ error: false, check: false });

  const isPurpose = expanded === 'Purpose';
  const isGreaterThanZeroPurpses = purposes && purposes.length > 0;
  const isLessThanElevenPurpses = purposes && purposes.length < 11;
  const hasFirstValidPurpose = purposes && purposes[0].value;
  const lastPurposeHasValue = purposes && purposes[purposes.length - 1].value;
  const hasAnyValidPurpose =
    purposes && purposes.some((purpose) => purpose.value);

  const deletePurposesWithoutValue = async () => {
    const remainingPurposes = purposes?.filter(
      (purpose, index) => index === 0 || purpose.value
    );

    setPurposes(remainingPurposes);
  };

  useEffect(() => {
    if (!isPurpose) {
      deletePurposesWithoutValue();
      if (hasError.check && purposes && !purposes[0].value) {
        setHasError({ error: true, check: true });
      }
    } else {
      setHasError({ error: false, check: true });
    }
  }, [expanded]);

  useEffect(() => {
    if (initialPurposes.length > 0) {
      const filteredPurposes = initialPurposes.map((item) => ({
        id: item.id,
        value: item.title,
      }));
      setPurposes(filteredPurposes);
    } else {
      setPurposes([
        {
          id: undefined,
          value: '',
        },
      ]);
    }
  }, [initialPurposes]);

  if (!purposes) return null;

  return (
    <FieldCard
      scrollRef={scrollRef}
      expanded={expanded}
      setExpanded={() => {
        setExpanded(isPurpose ? null : 'Purpose');
      }}
      error={
        hasError.check && hasError.error && !isPurpose
          ? `Please enter the purpose(s) of today's interaction`
          : undefined
      }
      required
      mb="xs"
      actionName={
        !hasAnyValidPurpose && !isPurpose ? (
          <TextMedium size="sm">Add Purpose</TextMedium>
        ) : (
          ''
        )
      }
      title="Purpose"
    >
      <View
        style={{
          height: isPurpose ? 'auto' : 0,
          overflow: 'hidden',
        }}
      >
        {purposes.map((purpose, index) => (
          <PurposeInput
            key={index}
            noteId={noteId}
            index={index}
            purpose={purpose}
            purposes={purposes}
            setPurposes={setPurposes}
            hasError={hasError.check && hasError.error}
          />
        ))}
        {isGreaterThanZeroPurpses &&
          isLessThanElevenPurpses &&
          lastPurposeHasValue && (
            <TextMedium
              mt="xs"
              style={{ textAlign: 'right' }}
              color={Colors.PRIMARY}
              onPress={() =>
                setPurposes([...purposes, { value: '', id: undefined }])
              }
              size="sm"
            >
              Add another Purpose
            </TextMedium>
          )}
      </View>

      {isGreaterThanZeroPurpses && hasFirstValidPurpose && (
        <View
          style={{
            paddingBottom: !isPurpose ? Spacings.md : 0,
            height: !isPurpose ? 'auto' : 0,
            overflow: 'hidden',
          }}
        >
          {purposes.map((purpose, index) => (
            <View
              key={index}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                marginTop: index === 0 ? 0 : Spacings.xs,
              }}
            >
              <CircleSolidIcon size="sm" color={Colors.PRIMARY_EXTRA_DARK} />
              <TextRegular ml="xs">{purpose.value}</TextRegular>
            </View>
          ))}
        </View>
      )}
    </FieldCard>
  );
}
