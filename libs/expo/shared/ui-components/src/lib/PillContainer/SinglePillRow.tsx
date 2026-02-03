import { Spacings } from '@monorepo/expo/shared/static';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { LayoutChangeEvent, PixelRatio, View } from 'react-native';
import { sortBy, uniqueBy } from 'remeda';
import Pill from '../Pill';
import type { IPillProps } from '../Pill/Pill';
import TextRegular from '../TextRegular';

// =======================
// Module-level shared caches
// =======================
const pillWidthCache = new Map<string, number>(); // key: `${variant}|${fontScale}|${label}`
const overflowWidthCache = new Map<string, number>(); // key: `${fontScale}|+ ${n}`

const makePillKey = (
  variant: IPillProps['variant'],
  fontScale: number,
  label: string
) => `${variant}|${fontScale}|${label}`;

const makeOverflowKey = (fontScale: number, remaining: number) =>
  `${fontScale}|+ ${remaining}`;

// =======================
// Types
// =======================
type SortMode = 'preserve' | 'shortest-first';

export type SinglePillRowProps = {
  pills: string[];
  pillVariant: IPillProps['variant'];
  sortMode?: SortMode; // default 'shortest-first'
  gap?: number; // default Spacings.xxs
  dedupe?: boolean; // default true
  caseInsensitive?: boolean; // default false
  // First-pass estimate to avoid blank row before real widths land:
  estimateCharWidth?: number; // default 7
  estimateBasePadding?: number; // default 22
};

type HiddenMeasureRowProps = {
  pillsToMeasure: string[];
  pillVariant: IPillProps['variant'];
  onPillWidth: (label: string, w: number) => void;
  overflowProbe: string | null;
  onOverflowWidth: (key: string, w: number) => void;
  gap: number;
};

// =======================
// Hidden measurer
// Only renders labels we *haven't* cached yet (+ current overflow probe)
// =======================
const HiddenMeasureRow = ({
  pillsToMeasure,
  pillVariant,
  onPillWidth,
  overflowProbe,
  onOverflowWidth,
  gap,
}: HiddenMeasureRowProps): React.ReactElement => (
  <View
    style={{ opacity: 0, height: 0, overflow: 'hidden' }}
    collapsable={false}
    accessibilityElementsHidden
    importantForAccessibility="no-hide-descendants"
  >
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      {pillsToMeasure.map((label: string, _i: number) => (
        <View
          key={`measure-${label}`}
          style={{ marginLeft: _i === 0 ? 0 : gap }}
          onLayout={(e) => onPillWidth(label, e.nativeEvent.layout.width)}
        >
          <Pill variant={pillVariant} label={label} />
        </View>
      ))}
      {overflowProbe && (
        <View
          style={{ marginLeft: gap }}
          onLayout={(e) =>
            onOverflowWidth(overflowProbe, e.nativeEvent.layout.width)
          }
        >
          <TextRegular size="sm">{overflowProbe}</TextRegular>
        </View>
      )}
    </View>
  </View>
);

// =======================
// Component
// =======================
const byCase = (s: string, ci: boolean) => (ci ? s.toLowerCase() : s);

export const SinglePillRow = React.memo(
  ({
    pills,
    pillVariant,
    sortMode = 'shortest-first',
    gap = Spacings.xxs,
    dedupe = true,
    caseInsensitive = false,
    estimateCharWidth = 7,
    estimateBasePadding = 22,
  }: SinglePillRowProps): React.ReactElement => {
    const fontScale = PixelRatio.getFontScale(); // include user accessibility setting in cache key

    // UI state
    const [visibleCount, setVisibleCount] = useState(0);
    const [overflowProbe, setOverflowProbe] = useState<string | null>(null);

    // Refs
    const containerWidthRef = useRef(0);
    const rafIdRef = useRef<number | null>(null);

    // Queue a single RAF for recalc to avoid stacking multiple calls
    const queueRecalc = useCallback((fn: () => void) => {
      if (rafIdRef.current != null) return;
      rafIdRef.current = requestAnimationFrame(() => {
        rafIdRef.current = null;
        fn();
      });
    }, []);

    // 1) Dedupe first (preserve first occurrence). Using a content-based key so in-place mutations are detected.
    const basePills: string[] = useMemo(() => {
      if (!dedupe) return pills;
      return uniqueBy(pills, (label: string) => byCase(label, caseInsensitive));
    }, [pills, dedupe, caseInsensitive]);

    const baseKey = useMemo(() => basePills.join('|'), [basePills]);

    // 2) Estimate width for unknown labels to avoid blank-first-pass
    const estimateWidth = useCallback(
      (label: string) => estimateBasePadding + estimateCharWidth * label.length,
      [estimateBasePadding, estimateCharWidth]
    );

    // 3) Compute the array we’ll *display* (optionally shortest-first).
    //    For sorting we prefer cached width, fall back to estimated width.
    const displayPills: string[] = useMemo(() => {
      if (sortMode !== 'shortest-first') return basePills;

      return sortBy(
        basePills,
        (label: string) => {
          const cached = pillWidthCache.get(
            makePillKey(pillVariant, fontScale, label)
          );
          return cached ?? estimateWidth(label);
        },
        (label: string) => label // stable tiebreaker
      );
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [baseKey, sortMode, fontScale, pillVariant, estimateWidth]);

    // 4) Which labels still need measuring?
    const pillsToMeasure: string[] = useMemo(
      () =>
        displayPills.filter(
          (label) =>
            !pillWidthCache.has(makePillKey(pillVariant, fontScale, label))
        ),
      [displayPills, pillVariant, fontScale]
    );

    // Are all current labels measured?
    const allMeasured = useMemo(
      () =>
        displayPills.every((label) =>
          pillWidthCache.has(makePillKey(pillVariant, fontScale, label))
        ),
      [displayPills, pillVariant, fontScale]
    );

    // 5) Recalc fit — hybrid (cached widths preferred, estimates for unknowns)
    const recalc = useCallback(() => {
      const CW = containerWidthRef.current;
      if (CW <= 0) return;

      // Build width vector using cached or estimated widths
      const widths: number[] = displayPills.map((label) => {
        const key = makePillKey(pillVariant, fontScale, label);
        return pillWidthCache.get(key) ?? estimateWidth(label);
      });

      let k = widths.length;
      while (k >= 0) {
        let total = 0;
        for (let i = 0; i < k; i++) total += widths[i] + (i > 0 ? gap : 0);

        const needsOverflow = k < widths.length;
        if (needsOverflow) {
          const remaining = widths.length - k;
          const ok = makeOverflowKey(fontScale, remaining);
          let ow = overflowWidthCache.get(ok);

          // If we don't have an exact overflow width yet, measure it.
          if (typeof ow !== 'number') {
            setOverflowProbe(`+ ${remaining}`);
            // Still include a conservative estimate to prevent dropping to 0
            // (using text length * char width + a tiny base)
            ow =
              estimateBasePadding +
              estimateCharWidth * String(remaining).length +
              10;
          }

          total += (k > 0 ? gap : 0) + ow;
        }

        if (total <= CW) {
          // LATCH: avoid flicker to 0 while not all measured
          if (k === 0 && !allMeasured && visibleCount > 0) {
            return; // keep previous non-zero count until stable
          }
          if (visibleCount !== k) setVisibleCount(k);
          return;
        }
        k -= 1;
      }

      // Only drop to 0 if all are measured (true "doesn't fit") or there are no pills
      if ((allMeasured || displayPills.length === 0) && visibleCount !== 0) {
        setVisibleCount(0);
      }
    }, [
      displayPills,
      gap,
      visibleCount,
      estimateWidth,
      fontScale,
      pillVariant,
      allMeasured,
      estimateBasePadding,
      estimateCharWidth,
    ]);

    // 6) Handlers
    const onContainerLayout = useCallback(
      (e: LayoutChangeEvent) => {
        const w = e.nativeEvent.layout.width;
        if (w > 0 && w !== containerWidthRef.current) {
          containerWidthRef.current = w;
          queueRecalc(recalc);
        }
      },
      [queueRecalc, recalc]
    );

    const onPillWidth = useCallback(
      (label: string, w: number) => {
        const key = makePillKey(pillVariant, fontScale, label);
        if (pillWidthCache.get(key) !== w) {
          pillWidthCache.set(key, w);
          queueRecalc(recalc);
        }
      },
      [queueRecalc, recalc, pillVariant, fontScale]
    );

    const onOverflowWidth = useCallback(
      (probeText: string, w: number) => {
        const n = Number(probeText.replace('+', '').trim());
        const key = makeOverflowKey(fontScale, Number.isFinite(n) ? n : 0);
        if (overflowWidthCache.get(key) !== w) {
          overflowWidthCache.set(key, w);
          setOverflowProbe(null);
          queueRecalc(recalc);
        }
      },
      [queueRecalc, recalc, fontScale]
    );

    // 7) Reset fit when content/order changes
    useEffect(() => {
      setOverflowProbe(null);
      queueRecalc(recalc);
    }, [baseKey, queueRecalc, recalc]);

    // 8) First fit
    useEffect(() => {
      queueRecalc(recalc);
    }, [queueRecalc, recalc]);

    return (
      <View
        onLayout={onContainerLayout}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          marginBottom: Spacings.xs,
        }}
      >
        {displayPills.slice(0, visibleCount).map((label: string, i: number) => (
          <View key={`pill-${label}`} style={{ marginLeft: i === 0 ? 0 : gap }}>
            <Pill variant={pillVariant} label={label} />
          </View>
        ))}

        {/* Avoid showing lone "+N" before we can render any pill */}
        {visibleCount < displayPills.length &&
          (visibleCount > 0 || allMeasured) && (
            <View style={{ marginLeft: visibleCount > 0 ? gap : 0 }}>
              <TextRegular size="sm">
                + {displayPills.length - visibleCount}
              </TextRegular>
            </View>
          )}

        {/* Hidden measurer renders ONLY uncached labels (+ current overflow probe) */}
        {(pillsToMeasure.length > 0 || overflowProbe) && (
          <HiddenMeasureRow
            pillsToMeasure={pillsToMeasure}
            pillVariant={pillVariant}
            onPillWidth={onPillWidth}
            overflowProbe={overflowProbe}
            onOverflowWidth={onOverflowWidth}
            gap={gap}
          />
        )}
      </View>
    );
  }
);
