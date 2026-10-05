import { ExternalLinkOutlinedIcon } from '@monorepo/expo/shared/icons';
import { Colors, Spacings } from '@monorepo/expo/shared/static';
import { TextBold, TextRegular } from '@monorepo/expo/shared/ui-components';
import * as WebBrowser from 'expo-web-browser';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { matchTags, type TTag } from './shelterAttributes';

// Reusable shelter sub-elements shared by the shelter picker and the
// referral card (the wireframe draws them as separate screens, but the
// information overlaps almost entirely).

// shelter name + location
export function ShelterHeader({
  name,
  place,
}: {
  name: string;
  place?: string | null;
}) {
  return (
    <View style={styles.headerBlock}>
      <TextBold size="sm">{name}</TextBold>
      {place ? (
        <TextRegular size="sm" color={Colors.NEUTRAL_DARK}>
          {place}
        </TextRegular>
      ) : null}
    </View>
  );
}

// directory link row (attribute tags render in their own wrapping row below)
export function ShelterDetailsRow({ shelterId }: { shelterId: string }) {
  const url = shelterDirectoryUrl(shelterId);
  if (!url) return null;

  return (
    <View style={styles.detailsRow}>
      <Pressable
        style={styles.directoryLink}
        onPress={() =>
          // in-app browser sheet (repo pattern, see WebBrowserLink) so the
          // referral flow isn't abandoned.
          WebBrowser.openBrowserAsync(url)
        }
        accessibilityRole="link"
      >
        <TextRegular size="sm" color={Colors.PRIMARY}>
          View in Shelter Directory
        </TextRegular>
        <ExternalLinkOutlinedIcon size="sm" color={Colors.PRIMARY} />
      </Pressable>
    </View>
  );
}

/**
 * shelter-web's detail route is `/shelter/:id`; its public hostname differs per
 * environment and is not settled for production yet (tracking doc C3). Without
 * a configured base URL there is no correct destination, so the link is hidden
 * rather than pointing somewhere wrong.
 */
export function shelterDirectoryUrl(shelterId: string): string | null {
  const baseUrl = process.env['EXPO_PUBLIC_SHELTER_WEB_URL'];
  if (!baseUrl) return null;
  return `${baseUrl.replace(/\/$/, '')}/shelter/${shelterId}`;
}

// container for one-or-more tags (referral status, outcomes, shelter
// attributes — the wireframe shows entries carrying two tags at once).
// size 'xs' is the compact variant for dense attribute rows.
export function TagRow({
  tags,
  size = 'sm',
}: {
  tags: TTag[];
  size?: 'sm' | 'xs';
}) {
  return (
    <View style={styles.tagRow}>
      {tags.map((tag) => {
        // outline = the claim is unconfirmed, so carry the colour on the border
        // and text instead of filling the badge. The border is on both variants
        // (transparent when solid) so switching can't shift the row's layout.
        const outline = tag.variant === 'outline';
        return (
          <View
            key={tag.label}
            style={[
              styles.tagBadge,
              size === 'xs' && styles.tagBadgeXs,
              outline
                ? { borderColor: tag.color }
                : { backgroundColor: tag.color, borderColor: tag.color },
            ]}
          >
            <TextRegular
              size={size === 'xs' ? 'xxs' : 'xs'}
              color={outline ? tag.color : Colors.WHITE}
            >
              {tag.label}
            </TextRegular>
          </View>
        );
      })}
    </View>
  );
}

// the full shelter block: header + attribute tags + details row
export function ShelterCard({
  id,
  name,
  place,
  attributes,
  desiredAttributes,
}: {
  id: string;
  name: string;
  place?: string | null;
  attributes?: string[];
  desiredAttributes?: string[];
}) {
  const [showOther, setShowOther] = useState(false);

  const reported = attributes ?? [];
  const hasNeeds = (desiredAttributes?.length ?? 0) > 0;
  const attributeTags = matchTags(reported, desiredAttributes);

  // Unreported is not unsuitable — coverage is patchy per category, so a need
  // the shelter was never asked about is unknowable rather than unmet.
  // matchTags downgrades those to `unknown` (red outline, not red fill); the
  // notice below is the legend that explains why they read weaker.
  const reportedNothing = reported.length === 0;
  const hasUnknown = attributeTags.some((tag) => tag.kind === 'unknown');
  const notice = hasUnknown
    ? 'Outlined needs were not reported by this shelter'
    : reportedNothing
      ? 'No attributes reported for this shelter'
      : null;

  // With client needs, every need shows (match or gap) however many there are —
  // the count reflects the need set the user chose, so capping it would hide the
  // consequence of that choice. What collapses is `other`: attributes the
  // shelter offers that nobody asked about, a second-level consideration.
  // Without needs there is nothing to compare against and everything is
  // `other`, so collapsing would empty the row — show it as-is.
  const relevant = hasNeeds
    ? attributeTags.filter((tag) => tag.kind !== 'other')
    : attributeTags;
  const other = hasNeeds
    ? attributeTags.filter((tag) => tag.kind === 'other')
    : [];
  const visible = showOther ? [...relevant, ...other] : relevant;

  return (
    <View style={styles.shelterCard}>
      <ShelterHeader name={name} place={place} />
      <ShelterDetailsRow shelterId={id} />

      {notice && (
        <TextRegular size="xxs" color={Colors.NEUTRAL_DARK}>
          {notice}
        </TextRegular>
      )}

      {visible.length > 0 && <TagRow tags={visible} size="xs" />}

      {other.length > 0 && (
        <Pressable
          testID="shelter-other-attributes-toggle"
          onPress={() => setShowOther((shown) => !shown)}
          accessibilityRole="button"
          accessibilityHint={
            showOther
              ? 'hides attributes the client stated no need for'
              : 'shows additional attributes this shelter offers'
          }
        >
          <TextRegular size="xxs" color={Colors.PRIMARY}>
            {showOther
              ? 'Show fewer attributes'
              : `+${other.length} more attribute${
                  other.length === 1 ? '' : 's'
                }`}
          </TextRegular>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  shelterCard: {
    gap: Spacings.xxs,
  },
  headerBlock: {
    gap: 2,
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  directoryLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacings.xxs,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacings.xxs,
  },
  tagBadge: {
    paddingHorizontal: Spacings.xs,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  tagBadgeXs: {
    paddingHorizontal: Spacings.xxs,
    paddingVertical: 1,
  },
});
