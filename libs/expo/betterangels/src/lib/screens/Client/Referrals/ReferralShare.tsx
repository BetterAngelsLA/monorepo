import { Colors, Spacings } from '@monorepo/expo/shared/static';
import { TextBold, TextRegular } from '@monorepo/expo/shared/ui-components';
import { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  buildReferralTextCopy,
  type ExportReferral,
  type ReferralTextCopy,
} from './referralExport';
import { shareReferralText, shareReferralTextFile } from './shareReferralText';

export function ReferralShare({
  referral,
  clientName,
}: {
  referral: ExportReferral;
  clientName: string;
}) {
  const insets = useSafeAreaInsets();
  const session = useRef<symbol | null>(null);
  const mounted = useRef(true);
  const sharing = useRef(false);
  const [busy, setBusy] = useState(false);
  const [includePrivate, setIncludePrivate] = useState(false);
  const [preview, setPreview] = useState<{
    standard: ReferralTextCopy;
    full: ReferralTextCopy;
  } | null>(null);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      session.current = null;
    };
  }, []);
  const close = () => {
    session.current = null;
    setPreview(null);
  };
  const open = () => {
    if (sharing.current) return;
    try {
      const source = {
        referral,
        clientName,
        generatedAt: new Date().toISOString(),
      };
      const copies = {
        standard: buildReferralTextCopy(source),
        full: buildReferralTextCopy({ ...source, includePrivate: true }),
      };
      session.current = Symbol();
      setIncludePrivate(false);
      setPreview(copies);
    } catch {
      Alert.alert(
        'Cannot prepare referral summary',
        'This referral uses an unreadable or newer intake format. Its saved data is unchanged.',
      );
    }
  };
  const copy = includePrivate ? preview?.full : preview?.standard;
  const share = async (asFile: boolean) => {
    if (!copy || !session.current || sharing.current) return;
    const current = session.current;
    const isCurrent = () => session.current === current;
    sharing.current = true;
    setBusy(true);
    try {
      if (asFile) await shareReferralTextFile(copy, isCurrent);
      else await shareReferralText(copy);
    } catch (error) {
      if (__DEV__)
        console.warn(
          'Referral sharing failed:',
          error instanceof Error ? error.message : 'Unknown native error',
        );
      if (isCurrent())
        Alert.alert(
          'Could not open sharing',
          'Try again, or use the other sharing option. The saved referral is unchanged.',
        );
    } finally {
      sharing.current = false;
      if (mounted.current) setBusy(false);
    }
  };
  return (
    <>
      <Pressable
        testID={`share-referral-${referral.id}`}
        style={styles.action}
        onPress={open}
        disabled={busy}
        accessibilityState={{ disabled: busy }}
        accessibilityRole="button"
        accessibilityLabel={`Share referral summary for ${referral.shelter?.name ?? 'unknown shelter'}`}
        accessibilityHint="opens a review before choosing a sharing destination"
      >
        <TextBold color={Colors.PRIMARY}>Share summary</TextBold>
      </Pressable>
      <Modal visible={!!preview} animationType="slide" onRequestClose={close}>
        <View
          style={[
            styles.container,
            { paddingTop: insets.top, paddingBottom: insets.bottom },
          ]}
        >
          <View style={styles.header}>
            <TextBold>Review referral summary</TextBold>
            <Pressable
              testID="referral-share-close"
              onPress={close}
              style={styles.action}
              accessibilityRole="button"
            >
              <TextBold color={Colors.PRIMARY}>Close</TextBold>
            </Pressable>
          </View>
          <TextRegular>
            Review the copy, then choose an app or destination. Sharing does not
            change the referral's status or confirm delivery.
          </TextRegular>
          <Pressable
            testID="referral-share-include-private"
            style={styles.action}
            disabled={busy}
            onPress={() => setIncludePrivate(!includePrivate)}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: includePrivate, disabled: busy }}
            accessibilityLabel="Include sensitive intake and staff notes"
            accessibilityHint="changes which saved information appears in this copy"
          >
            <TextRegular>
              {includePrivate ? '☑' : '☐'} Include sensitive intake and staff
              notes
            </TextRegular>
          </Pressable>
          <ScrollView style={styles.preview}>
            <TextRegular
              testID="referral-share-preview"
              selectable
              color={Colors.PRIMARY_EXTRA_DARK}
            >
              {copy?.text}
            </TextRegular>
          </ScrollView>
          <Pressable
            style={styles.action}
            disabled={busy}
            accessibilityState={{ disabled: busy }}
            accessibilityRole="button"
            onPress={() => {
              void share(false);
            }}
          >
            <TextBold color={Colors.PRIMARY}>Share text</TextBold>
          </Pressable>
          <Pressable
            style={styles.action}
            disabled={busy}
            accessibilityState={{ disabled: busy }}
            accessibilityRole="button"
            onPress={() => {
              void share(true);
            }}
          >
            <TextBold color={Colors.PRIMARY}>Share text file (.txt)</TextBold>
          </Pressable>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.WHITE,
    paddingHorizontal: Spacings.md,
    gap: Spacings.sm,
  },
  header: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  action: {
    minHeight: 48,
    justifyContent: 'center',
    paddingVertical: Spacings.xs,
  },
  preview: {
    flex: 1,
    backgroundColor: Colors.NEUTRAL_EXTRA_LIGHT,
    padding: Spacings.sm,
  },
});
