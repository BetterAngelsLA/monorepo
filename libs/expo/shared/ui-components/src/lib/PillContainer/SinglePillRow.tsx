// SinglePillRow.tsx — ultra-compact, RN 0.81 / Fabric + FlashList safe
import { Spacings } from '@monorepo/expo/shared/static';
import React, { useEffect, useMemo, useState } from 'react';
import {
  LayoutChangeEvent,
  NativeSyntheticEvent,
  PixelRatio,
  Platform,
  StyleSheet,
  TextLayoutEventData,
  View,
} from 'react-native';
import Pill from '../Pill';
import { IPillProps } from '../Pill/Pill';
import TextRegular from '../TextRegular';

type Props = {
  pills: string[];
  pillVariant: IPillProps['variant'];
  containerHPad?: number; // inner L/R padding of parent cell (if any)
  skeletonHeight?: number; // placeholder height while measuring
};

const px = (n: number) => Math.floor(PixelRatio.roundToNearestPixel(n));
const GAP = px(Spacings.xxs ?? 4);
const OGAP = px(Spacings.xs ?? 8);
const SAFETY = Platform.select({ ios: 2, android: 3, default: 3 }) ?? 3; // no non-null assertion
const RIGHT_PAD = SAFETY; // tiny landing zone on right edge
const K = 1.12; // inflation to avoid underestimation

type MeasureTuple = [
  number | undefined, // repTextW
  number | undefined, // repPillW
  number | undefined, // +9
  number | undefined, // +99
  number | undefined // +999
];

export const SinglePillRow: React.FC<Props> = React.memo(
  function SinglePillRow({
    pills,
    pillVariant,
    containerHPad = 0,
    skeletonHeight = 32,
  }) {
    const [W, setW] = useState(0);
    const [visible, setVisible] = useState(1);
    const [ready, setReady] = useState(false);

    // minimal measurements in a compact tuple: [repTextW, repPillW, +9, +99, +999]
    const [[tW, pW, o1, o2, o3], setM] = useState<MeasureTuple>(
      [] as unknown as MeasureTuple
    );

    // sort shortest→longest to pack more
    const sorted = useMemo(() => {
      const c = [...pills];
      c.sort((a, b) => a.length - b.length);
      return c;
    }, [pills]);

    // representative = longest
    const rep = useMemo(
      () =>
        sorted.length
          ? sorted.reduce((a, b) => (a.length >= b.length ? a : b))
          : '',
      [sorted]
    );

    // single recompute effect
    useEffect(() => {
      if (
        !W ||
        !rep ||
        tW == null ||
        pW == null ||
        o1 == null ||
        o2 == null ||
        o3 == null
      )
        return;

      const chrome = Math.max(0, px(pW - tW));
      const avg = tW / Math.max(1, rep.length);
      const max = W - RIGHT_PAD - SAFETY;

      const pillW = (s: string) => px(avg * s.length * K) + chrome;
      const chip = (remain: number) =>
        remain <= 0
          ? 0
          : OGAP +
            px(remain >= 100 ? o3 : remain >= 10 ? o2 : o1) +
            (SAFETY + 1);

      // 1) greedily add pills
      let sum = 0,
        n = 0;
      for (let i = 0; i < sorted.length; i++) {
        const add = (n ? GAP : 0) + pillW(sorted[i]);
        if (sum + add <= max) {
          sum += add;
          n++;
        } else break;
      }

      // 2) if overflow required, clamp until "+N" fits
      if (n < sorted.length) {
        while (n > 0 && sum + chip(sorted.length - n) > max) {
          const last = pillW(sorted[n - 1]);
          sum -= last + (n > 1 ? GAP : 0);
          n--;
        }
      }

      setVisible(Math.max(1, n));
      setReady(true);
    }, [W, rep, tW, pW, o1, o2, o3, sorted]);

    // container width
    const onRowLayout = (e: LayoutChangeEvent) => {
      const raw = e?.nativeEvent?.layout?.width ?? 0;
      const inner = px(raw - containerHPad * 2);
      if (inner > 0 && inner !== W) setW(inner);
    };

    // measurers (typed events — no `any`)
    const onTextRep = (e: NativeSyntheticEvent<TextLayoutEventData>) => {
      const w = e.nativeEvent.lines?.[0]?.width;
      if (typeof w === 'number' && w > 0 && w !== tW) {
        setM((prev) => {
          const next: MeasureTuple = [
            w,
            prev?.[1],
            prev?.[2],
            prev?.[3],
            prev?.[4],
          ];
          return next;
        });
      }
    };
    const onPillRep = (e: LayoutChangeEvent) => {
      const w = px(e?.nativeEvent?.layout?.width ?? 0);
      if (w > 0 && w !== pW) {
        setM((prev) => {
          const next: MeasureTuple = [
            prev?.[0],
            w,
            prev?.[2],
            prev?.[3],
            prev?.[4],
          ];
          return next;
        });
      }
    };
    const onOw =
      (idx: 0 | 1 | 2) => (e: NativeSyntheticEvent<TextLayoutEventData>) => {
        const w = e.nativeEvent.lines?.[0]?.width;
        if (typeof w !== 'number' || w <= 0) return;
        setM((prev) => {
          const next: MeasureTuple = [
            prev?.[0],
            prev?.[1],
            prev?.[2],
            prev?.[3],
            prev?.[4],
          ];
          next[2 + idx] = w;
          return next;
        });
      };

    const overflow = Math.max(0, sorted.length - visible);

    return (
      <View style={styles.root} collapsable={false}>
        <View
          style={[styles.row, !ready && { height: skeletonHeight }]}
          onLayout={onRowLayout}
          collapsable={false}
        >
          {ready &&
            sorted.slice(0, visible).map((label, i) => (
              <View
                key={`${label}-${i}`}
                style={{ marginLeft: i ? GAP : 0 }}
                collapsable={false}
              >
                <Pill variant={pillVariant} label={label} />
              </View>
            ))}

          {ready && overflow > 0 && (
            <View style={styles.plus} collapsable={false}>
              <TextRegular size="sm">+ {overflow}</TextRegular>
            </View>
          )}

          {/* measurers (inside row; tiny opacity so glyphs lay out) */}
          <View
            style={styles.meas}
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
            <TextRegular size="sm" numberOfLines={1} onTextLayout={onOw(0)}>
              + 9
            </TextRegular>
            <TextRegular size="sm" numberOfLines={1} onTextLayout={onOw(1)}>
              + 99
            </TextRegular>
            <TextRegular size="sm" numberOfLines={1} onTextLayout={onOw(2)}>
              + 999
            </TextRegular>
          </View>
        </View>
      </View>
    );
  }
);

const styles = StyleSheet.create({
  // no overflow:'hidden' to avoid tiny clip; we use a small right padding instead
  root: {},
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacings.xs ?? 8,
    paddingRight: SAFETY,
  },
  plus: { marginLeft: OGAP, flexShrink: 0 },
  meas: { position: 'absolute', left: 0, top: 0, opacity: 0.0 },
});
