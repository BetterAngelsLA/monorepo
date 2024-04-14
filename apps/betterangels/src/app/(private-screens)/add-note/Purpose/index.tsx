import { SolidCircleIcon } from '@monorepo/expo/shared/icons';
import { Colors, Spacings } from '@monorepo/expo/shared/static';
import { BodyText, FieldCard, H5 } from '@monorepo/expo/shared/ui-components';
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import PurposeInput from './PurposeInput';

interface IPurposeProps {
  expanded: string | undefined | null;
  setExpanded: (expanded: string | undefined | null) => void;
  noteId: string | undefined;
}

export default function Purpose(props: IPurposeProps) {
  const { expanded, setExpanded, noteId } = props;

  const [purposes, setPurposes] = useState<
    Array<{
      id: string | undefined;
      value: string;
    }>
  >([
    {
      id: undefined,
      value: '',
    },
  ]);
  const [hasError, setHasError] = useState({ error: false, check: false });

  const isPurpose = expanded === 'Purpose';
  const isGreaterThanZeroPurpses = purposes.length > 0;
  const isLessThanElevenPurpses = purposes.length < 11;
  const hasFirstValidPurpose = purposes[0].value;
  const lastPurposeHasValue = purposes[purposes.length - 1].value;
  const hasAnyValidPurpose = purposes.some((purpose) => purpose.value);

  const deletePurposesWithoutValue = async () => {
    const remainingPurposes = purposes.filter(
      (purpose, index) => index === 0 || purpose.value
    );

    setPurposes(remainingPurposes);
  };

  useEffect(() => {
    if (!isPurpose) {
      deletePurposesWithoutValue();
      if (hasError.check && !purposes[0].value) {
        setHasError({ error: true, check: true });
      }
    } else {
      setHasError({ error: false, check: true });
    }
  }, [expanded]);

  return (
    <FieldCard
      expanded={expanded}
      setExpanded={() => setExpanded(isPurpose ? null : 'Purpose')}
      error={
        hasError.check && hasError.error && !isPurpose
          ? `Please enter the purpose(s) of today's interaction`
          : undefined
      }
      required
      mb="xs"
      actionName={
        !hasAnyValidPurpose && !isPurpose ? <H5 size="sm">Add Purpose</H5> : ''
      }
      title="Purpose"
    >
      <View
        style={{
          paddingBottom: isPurpose ? Spacings.md : 0,
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
            <H5
              mt="xs"
              textAlign="right"
              color={Colors.PRIMARY}
              onPress={() =>
                setPurposes([...purposes, { value: '', id: undefined }])
              }
              size="sm"
            >
              Add another Purpose
            </H5>
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
              <SolidCircleIcon size="sm" color={Colors.PRIMARY_EXTRA_DARK} />
              <BodyText ml="xs">{purpose.value}</BodyText>
            </View>
          ))}
        </View>
      )}
    </FieldCard>
  );
}
