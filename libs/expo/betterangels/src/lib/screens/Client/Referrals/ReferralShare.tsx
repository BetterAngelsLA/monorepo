import { Colors, Spacings } from '@monorepo/expo/shared/static';
import { TextBold, TextRegular } from '@monorepo/expo/shared/ui-components';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  buildReferralDocumentCopy,
  referralDocumentBlockText,
  type ExportReferral,
  type ReferralDocumentCopy,
} from './referralExport';
import {
  shareReferralPng,
  shareReferralText,
  shareReferralTextFile,
} from './shareReferralText';
import type { ProfileCardData } from './shared/referralProfile';
import { ReferralImagePreview } from './ReferralImagePreview';
import { layoutReferralImage } from './referralImage';
import useSnackbar from '../../../hooks/snackbar/useSnackbar';

export function ReferralShare({
  referral,
  clientName,
  profile,
}: {
  referral: ExportReferral;
  clientName: string;
  profile?: ProfileCardData | null;
}) {
  const insets = useSafeAreaInsets();
  const { showSnackbar } = useSnackbar();
  const session = useRef<symbol | null>(null);
  const mounted = useRef(true);
  const sharing = useRef(false);
  const [busy, setBusy] = useState(false);
  // The share sheet lives inside a full-screen Modal, so a snackbar rendered at
  // the app root paints *behind* it. Failures are surfaced in the modal itself.
  const [shareError, setShareError] = useState<string | null>(null);
  const [includePrivate, setIncludePrivate] = useState(false);
  const [imageMode, setImageMode] = useState(false);
  const [imageCapture, setImageCapture] = useState<{
    copy: ReferralDocumentCopy;
    capture: () => Promise<string>;
  } | null>(null);
  const [preview, setPreview] = useState<{
    standard: ReferralDocumentCopy;
    full: ReferralDocumentCopy;
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
    setImageMode(false);
    setImageCapture(null);
  };
  const open = () => {
    if (sharing.current) return;
    try {
      const source = {
        referral,
        clientName,
        profile,
        generatedAt: new Date().toISOString(),
      };
      const copies = {
        standard: buildReferralDocumentCopy(source),
        full: buildReferralDocumentCopy({ ...source, includePrivate: true }),
      };
      session.current = Symbol();
      setIncludePrivate(false);
      setImageMode(false);
      setImageCapture(null);
      setPreview(copies);
    } catch {
      showSnackbar({
        message:
          'This referral uses an unreadable or newer intake format. Its saved data is unchanged.',
        type: 'error',
      });
    }
  };
  const copy = includePrivate ? preview?.full : preview?.standard;
  const image = useMemo(() => {
    if (!imageMode || !copy) return null;
    try {
      return { layout: layoutReferralImage(copy), error: null };
    } catch {
      return {
        layout: null,
        error:
          'This summary is too large for one PNG image. Use text sharing for the complete copy.',
      };
    }
  }, [copy, imageMode]);
  // Native only: the capture reads pixels back from the SVG view, which the web
  // build cannot do (no `toDataURL`), so the image control is hidden there.
  const supportsImagePreview = Platform.OS !== 'web';
  const canShareImage =
    supportsImagePreview && !!image?.layout && imageCapture?.copy === copy;
  const share = async (format: 'text' | 'txt' | 'png') => {
    if (!copy || !session.current || sharing.current) return;
    if (format === 'png' && !canShareImage) return;
    const current = session.current;
    const isCurrent = () => session.current === current;
    sharing.current = true;
    setBusy(true);
    setShareError(null);
    try {
      const textCopy = { title: copy.title, text: copy.text };
      if (format === 'png' && imageCapture)
        await shareReferralPng(imageCapture.capture, isCurrent);
      else if (format === 'txt')
        await shareReferralTextFile(textCopy, isCurrent);
      else await shareReferralText(textCopy);
    } catch (error) {
      if (__DEV__)
        console.warn(
          'Referral sharing failed:',
          error instanceof Error ? error.message : 'Unknown native error',
        );
      if (isCurrent()) {
        setShareError(
          'Could not open sharing. Try again, or use the other sharing option. The saved referral is unchanged.',
        );
        // Also announce it outside the modal, for the case where the user has
        // already dismissed the sheet.
        showSnackbar({
          message:
            'Could not open sharing. Try again, or use the other sharing option. The saved referral is unchanged.',
          type: 'error',
        });
      }
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
      {preview ? (
        <Modal visible animationType="slide" onRequestClose={close}>
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
            {shareError ? (
              <TextRegular
                testID="referral-share-error"
                color={Colors.ERROR}
                accessibilityLiveRegion="polite"
              >
                {shareError}
              </TextRegular>
            ) : null}
            <TextRegular>
              Review saved intake answers and current profile details. Missing
              answers are marked Not recorded. Sharing does not confirm
              delivery.
            </TextRegular>
            <Pressable
              testID="referral-share-include-private"
              style={styles.action}
              disabled={busy}
              onPress={() => setIncludePrivate((included) => !included)}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: includePrivate, disabled: busy }}
              accessibilityLabel="Include sensitive information and staff notes"
              accessibilityHint="adds profile accommodations, sensitive intake answers, and staff notes; client identity and basic profile facts remain in both copies"
            >
              <TextRegular>
                {includePrivate ? '☑' : '☐'} Include sensitive information and
                staff notes
              </TextRegular>
            </Pressable>
            <TextRegular
              testID="referral-share-privacy-status"
              accessibilityLiveRegion="polite"
            >
              {includePrivate
                ? 'Sensitive details included where recorded.'
                : copy?.withholdsSensitive
                  ? 'Sensitive details excluded. Client identity remains included.'
                  : 'No sensitive details recorded. Client identity remains included.'}
            </TextRegular>
            <ScrollView style={styles.preview}>
              {imageMode && copy && image?.layout ? (
                <ReferralImagePreview
                  key={includePrivate ? 'inclusive' : 'standard'}
                  layout={image.layout}
                  onReady={(capture) => setImageCapture({ copy, capture })}
                />
              ) : imageMode ? (
                <TextRegular testID="referral-image-error">
                  {image?.error}
                </TextRegular>
              ) : (
                <TextRegular
                  testID="referral-share-preview"
                  selectable
                  color={Colors.PRIMARY_EXTRA_DARK}
                >
                  {copy?.blocks.map((block, index) => {
                    const text =
                      referralDocumentBlockText(block) +
                      (index < copy.blocks.length - 1 ? '\n' : '');
                    return block.kind === 'field' &&
                      block.tone === 'warning' ? (
                      <TextRegular key={index} color={Colors.ERROR}>
                        {text}
                      </TextRegular>
                    ) : (
                      text
                    );
                  })}
                </TextRegular>
              )}
            </ScrollView>
            {/* PNG capture reads pixels back from the native SVG view; the web
              build has no `toDataURL`, so the control is not offered there. */}
            {supportsImagePreview ? (
              <Pressable
                testID="referral-image-mode"
                style={styles.action}
                disabled={busy}
                accessibilityRole="button"
                accessibilityState={{ disabled: busy }}
                onPress={() => {
                  setImageMode((active) => !active);
                  setImageCapture(null);
                }}
              >
                <TextBold color={Colors.PRIMARY}>
                  {imageMode ? 'Back to text preview' : 'Preview image (.png)'}
                </TextBold>
              </Pressable>
            ) : null}
            {imageMode && (
              <>
                <TextRegular size="sm">
                  PNG is an image, not searchable text. Use text sharing for a
                  copyable version.
                </TextRegular>
                <Pressable
                  testID="referral-share-png"
                  style={styles.action}
                  disabled={busy || !canShareImage}
                  accessibilityRole="button"
                  accessibilityState={{ disabled: busy || !canShareImage }}
                  onPress={() => {
                    void share('png');
                  }}
                >
                  <TextBold color={Colors.PRIMARY}>
                    {busy ? 'Preparing image…' : 'Share image (.png)'}
                  </TextBold>
                </Pressable>
              </>
            )}
            {!imageMode && (
              <>
                <Pressable
                  style={styles.action}
                  disabled={busy}
                  accessibilityState={{ disabled: busy }}
                  accessibilityRole="button"
                  onPress={() => {
                    void share('text');
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
                    void share('txt');
                  }}
                >
                  <TextBold color={Colors.PRIMARY}>
                    Share text file (.txt)
                  </TextBold>
                </Pressable>
              </>
            )}
          </View>
        </Modal>
      ) : null}
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
