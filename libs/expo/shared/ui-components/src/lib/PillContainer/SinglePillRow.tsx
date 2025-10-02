// SinglePillRow.tsx — RN 0.81 / Fabric + FlashList safe
import { Spacings } from '@monorepo/expo/shared/static';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  LayoutChangeEvent,
  PixelRatio,
  Platform,
  StyleSheet,
  View,
} from 'react-native';
import Pill from '../Pill';
import { IPillProps } from '../Pill/Pill';
import TextRegular from '../TextRegular';

type Props = {
  pills: string[];
  pillVariant: IPillProps['variant'];
  /** Inner L/R padding in the parent container (FlashList cell), if any */
  containerHPad?: number;
  /** Height of the placeholder while measuring (match your pill height) */
  skeletonHeight?: number;
};

const GAP = Spacings.xxs ?? 4; // between pills
const OGAP = Spacings.xs ?? 8; // before "+ N"

const px = (n: number) => Math.floor(PixelRatio.roundToNearestPixel(n));
const SAFETY_MAIN = Platform.select({ ios: 2, android: 3, default: 3 })!;
const SAFETY_OVERFLOW = SAFETY_MAIN + 1; // tiny extra for "+ N"
const RIGHT_PAD = SAFETY_MAIN; // gives a small landing zone on the right
const K = 1.12; // inflation to avoid under-estimation

// Largest k with predicate true
const upperBound = (lo: number, hi: number, ok: (k: number) => boolean) => {
  while (lo < hi) {
    const mid = Math.ceil((lo + hi) / 2);
    if (ok(mid)) lo = mid;
    else hi = mid - 1;
  }
  return lo;
};

export const SinglePillRow: React.FC<Props> = React.memo(
  function SinglePillRow({
    pills,
    pillVariant,
    containerHPad = 0,
    skeletonHeight = 32,
  }) {
    // Phase control (skeleton until measured)
    const [ready, setReady] = useState(false);

    // Container width
    const [containerW, setContainerW] = useState(0);
    const onContainerLayout = (e: LayoutChangeEvent) => {
      const raw = e?.nativeEvent?.layout?.width ?? 0;
      if (!raw) return;
      const inner = px(raw - containerHPad * 2);
      if (inner > 0 && inner !== containerW) setContainerW(inner);
    };

    // Pack tighter by rendering shortest → longest
    const sorted = useMemo(
      () => [...pills].sort((a, b) => a.length - b.length),
      [pills]
    );

    // Representative label = longest (for avgChar + chrome)
    const rep = useMemo(
      () =>
        sorted.length
          ? sorted.reduce((a, b) => (a.length >= b.length ? a : b))
          : '',
      [sorted]
    );

    // Minimal measurements
    const [repTextW, setRepTextW] = useState<number | null>(null); // longest as Text
    const [repPillW, setRepPillW] = useState<number | null>(null); // longest inside <Pill>

    // Measured widths for "+ 9", "+ 99", "+ 999"
    const [ow1, setOw1] = useState<number | null>(null);
    const [ow2, setOw2] = useState<number | null>(null);
    const [ow3, setOw3] = useState<number | null>(null);

    // Final visible count
    const [visibleCount, setVisibleCount] = useState(1);

    const recompute = useCallback(() => {
      if (
        !containerW ||
        !rep ||
        repTextW == null ||
        repPillW == null ||
        ow1 == null ||
        ow2 == null ||
        ow3 == null
      ) {
        return;
      }

      const chrome = Math.max(0, px(repPillW - repTextW));
      const avgChar = repTextW / Math.max(1, rep.length);

      // Estimated pill widths (pixel-rounded + inflation)
      const widths = sorted.map(
        (label) => px(avgChar * label.length * K) + chrome
      );
      const n = widths.length;

      // Prefix sums with gaps
      const prefix = new Array(n + 1).fill(0);
      for (let k = 1; k <= n; k++) {
        prefix[k] = prefix[k - 1] + (k > 1 ? GAP : 0) + widths[k - 1];
      }

      const MAX = containerW;

      // Helper: reserve for "+ N" using measured buckets
      const reserve = (remain: number) => {
        if (remain <= 0) return 0;
        const proto = remain >= 100 ? ow3! : remain >= 10 ? ow2! : ow1!;
        return OGAP + px(proto) + SAFETY_OVERFLOW;
      };

      // Pass 1: try without overflow chip
      let k = upperBound(
        0,
        n,
        (i) => prefix[i] <= MAX - SAFETY_MAIN - RIGHT_PAD
      );

      // Pass 2: with measured overflow reservation
      if (k < n) {
        k = upperBound(
          0,
          n,
          (i) => prefix[i] + reserve(n - i) <= MAX - SAFETY_MAIN - RIGHT_PAD
        );
      }

      // Final clamp using the SAME reserve we render with (guarantees no spill)
      while (
        k > 0 &&
        prefix[k] + (k < n ? reserve(n - k) : 0) > MAX - RIGHT_PAD - SAFETY_MAIN
      ) {
        k--;
      }

      setVisibleCount(Math.max(1, k));
      setReady(true);
    }, [containerW, rep, repTextW, repPillW, ow1, ow2, ow3, sorted]);

    useEffect(() => {
      recompute();
    }, [recompute]);

    // ---- Measurers (always mounted; tiny opacity so Fabric/FlashList lays them out) ----
    const onTextRep = (e: any) => {
      const w = e?.nativeEvent?.lines?.[0]?.width;
      if (typeof w === 'number' && w > 0 && w !== repTextW) setRepTextW(w);
    };
    const onPillRep = (e: LayoutChangeEvent) => {
      const w = px(e?.nativeEvent?.layout?.width ?? 0);
      if (w > 0 && w !== repPillW) setRepPillW(w);
    };
    const onOw = (digits: 1 | 2 | 3) => (e: any) => {
      const w = e?.nativeEvent?.lines?.[0]?.width;
      if (typeof w !== 'number' || w <= 0) return;
      if (digits === 1 && ow1 == null) setOw1(w);
      if (digits === 2 && ow2 == null) setOw2(w);
      if (digits === 3 && ow3 == null) setOw3(w);
    };

    const overflow = Math.max(0, sorted.length - visibleCount);

    return (
      <View style={styles.root} collapsable={false}>
        <View
          style={[styles.row, !ready && { height: skeletonHeight }]}
          onLayout={onContainerLayout}
          collapsable={false}
        >
          {ready &&
            sorted.slice(0, visibleCount).map((label, idx) => (
              <View
                key={`${label}-${idx}`}
                style={{ marginLeft: idx === 0 ? 0 : GAP }}
                collapsable={false}
              >
                <Pill variant={pillVariant} label={label} />
              </View>
            ))}

          {ready && overflow > 0 && (
            <View
              style={{ marginLeft: OGAP, flexShrink: 0 }}
              collapsable={false}
            >
              <TextRegular size="sm">+ {overflow}</TextRegular>
            </View>
          )}

          {/* Invisible measurers kept in-row so Fabric/FlashList won’t prune them */}
          <View
            style={styles.measurers}
            pointerEvents="none"
            collapsable={false}
            accessible={false}
          >
            {!!rep && (
              <>
                <TextRegular
                  size="sm"
                  numberOfLines={1}
                  onTextLayout={onTextRep}
                >
                  {rep}
                </TextRegular>
                <View onLayout={onPillRep} collapsable={false}>
                  <Pill variant={pillVariant} label={rep} />
                </View>
              </>
            )}

            {/* Measure overflow chip prototypes (exact, digit-aware) */}
            <TextRegular size="sm" numberOfLines={1} onTextLayout={onOw(1)}>
              + 9
            </TextRegular>
            <TextRegular size="sm" numberOfLines={1} onTextLayout={onOw(2)}>
              + 99
            </TextRegular>
            <TextRegular size="sm" numberOfLines={1} onTextLayout={onOw(3)}>
              + 999
            </TextRegular>
          </View>
        </View>
      </View>
    );
  }
);

const styles = StyleSheet.create({
  // NOTE: no overflow:'hidden' — avoids clipping tiny rounding differences
  root: {},
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacings.xs ?? 8,
    paddingRight: RIGHT_PAD, // small right inset to absorb rounding
  },
  // Keep measurers inside row; tiny opacity so glyphs actually lay out
  measurers: {
    position: 'absolute',
    left: 0,
    top: 0,
    opacity: 0.0,
  },
});
