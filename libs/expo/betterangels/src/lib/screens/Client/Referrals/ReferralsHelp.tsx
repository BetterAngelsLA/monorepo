import { Colors, Spacings } from '@monorepo/expo/shared/static';
import { TextBold, TextRegular } from '@monorepo/expo/shared/ui-components';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { TagRow } from './ShelterCard';
import type { TTag } from './shelterAttributes';

/**
 * Help for the referrals list — chiefly the attribute-tag legend, which is not
 * self-explanatory: four states across two colours and two fills.
 *
 * Each legend row renders a real <TagRow>, using the same colour + variant the
 * shelter cards use, so the legend cannot drift from what it describes. A
 * hand-drawn swatch would silently go stale the first time the palette moves.
 */

type TLegendRow = { tag: TTag; meaning: string };

// The swatch label states what the colour means, rather than showing a sample
// attribute — the legend has to be readable without already knowing the scheme.
const LEGEND: TLegendRow[] = [
  {
    tag: {
      label: 'Client Need: Provided by Shelter',
      color: Colors.SUCCESS,
      kind: 'match',
      variant: 'solid',
    },
    meaning: 'The shelter offers something this client needs.',
  },
  {
    tag: {
      label: 'Client Need: Not Provided by Shelter',
      color: Colors.ERROR,
      kind: 'gap',
      variant: 'solid',
    },
    meaning:
      'The client needs this and the shelter does not offer it. The shelter ' +
      'reported this kind of attribute, so it is a confirmed mismatch.',
  },
  {
    tag: {
      label: 'Client Need: Not Reported by Shelter',
      color: Colors.ERROR,
      kind: 'unknown',
      variant: 'outline',
    },
    meaning:
      'The client needs this, but the shelter never reported this kind of ' +
      'attribute — so we do not know either way. Outlined, not filled: it is ' +
      'missing information, not a known mismatch. Worth calling to confirm.',
  },
  {
    tag: {
      label: 'Shelter Attribute: Not Needed by Client',
      color: Colors.NEUTRAL,
      kind: 'other',
      variant: 'solid',
    },
    meaning:
      'The shelter offers this but no need was recorded for it. These are ' +
      'hidden behind “+N more attributes” so the client’s own needs stay ' +
      'readable — tap to see them.',
  },
];

export function ReferralsHelp({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.root}>
        {/* Backdrop is a SIBLING behind the sheet, not its parent. Wrapping the
            sheet would mean blocking touch propagation to stop taps closing it —
            and any responder claim on the container starves the ScrollView
            inside, leaving the sheet unscrollable. */}
        <Pressable
          testID="referrals-help-backdrop"
          style={StyleSheet.absoluteFill}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="close help"
          accessibilityHint="closes the referrals help"
        />

        <View style={styles.sheet} accessibilityViewIsModal>
          {/* Only the body scrolls; Close is pinned below it. The scrollbar is
              left visible on purpose — it is the only cue that there is more
              text, and a help sheet whose exit scrolls out of reach is worse
              than one that is slightly less clean. */}
          <ScrollView style={styles.body}>
            <TextBold size="md" style={styles.title}>
              About this list
            </TextBold>

            <TextRegular size="sm" style={styles.para}>
              Every referral you have created for this client, newest first. A
              referral stays <TextBold size="sm">PENDING</TextBold> — the app
              cannot yet tell you whether a shelter accepted it.
            </TextRegular>

            <TextBold size="sm" style={styles.sectionLabel}>
              Shelter attribute tags
            </TextBold>
            <TextRegular size="sm" style={styles.para}>
              Tags compare what the shelter offers against what this client
              needs.
            </TextRegular>

            {LEGEND.map(({ tag, meaning }) => (
              <View key={tag.label} style={styles.legendRow}>
                <TagRow tags={[tag]} size="xs" />
                <TextRegular size="xs" color={Colors.NEUTRAL_DARK}>
                  {meaning}
                </TextRegular>
              </View>
            ))}

            <TextRegular
              size="xs"
              color={Colors.NEUTRAL_DARK}
              style={styles.para}
            >
              Matching compares attributes only. It never checks whether a bed
              is actually free — always confirm availability with the shelter.
            </TextRegular>
          </ScrollView>

          <View style={styles.footer}>
            <Pressable
              testID="referrals-help-close-btn"
              style={styles.closeBtn}
              onPress={onClose}
              accessibilityRole="button"
              accessibilityHint="closes the referrals help"
            >
              <TextBold size="sm" color={Colors.PRIMARY}>
                Close
              </TextBold>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    paddingHorizontal: Spacings.md,
  },
  sheet: {
    backgroundColor: Colors.WHITE,
    borderRadius: 12,
    paddingTop: Spacings.md,
    paddingHorizontal: Spacings.md,
    maxHeight: '80%',
  },
  // flexShrink lets the body give way inside the capped sheet so the pinned
  // footer is never pushed off the bottom
  body: {
    flexShrink: 1,
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: Colors.NEUTRAL_LIGHT,
    paddingTop: Spacings.xs,
    paddingBottom: Spacings.md,
    alignItems: 'flex-end',
  },
  title: {
    marginBottom: Spacings.xs,
  },
  sectionLabel: {
    marginTop: Spacings.md,
    marginBottom: Spacings.xxs,
  },
  para: {
    marginBottom: Spacings.xs,
  },
  legendRow: {
    gap: Spacings.xxs,
    marginBottom: Spacings.sm,
  },
  closeBtn: {
    borderWidth: 1,
    borderColor: Colors.PRIMARY,
    borderRadius: 8,
    paddingHorizontal: Spacings.md,
    paddingVertical: Spacings.xxs,
  },
});
