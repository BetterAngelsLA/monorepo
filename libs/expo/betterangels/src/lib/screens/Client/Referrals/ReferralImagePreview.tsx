import { useRef, useState } from 'react';
import { View } from 'react-native';
import Svg, { Rect, Text as SvgText } from 'react-native-svg';
import {
  captureReferralImage,
  type ReferralImageLayout,
} from './referralImage';

export function ReferralImagePreview({
  layout,
  onReady,
}: {
  layout: ReferralImageLayout;
  onReady: (capture: () => Promise<string>) => void;
}) {
  const svg = useRef<Svg | null>(null);
  const [width, setWidth] = useState(320);
  return (
    <View onLayout={(event) => setWidth(event.nativeEvent.layout.width)}>
      <Svg
        ref={svg}
        testID="referral-image-preview"
        width={width}
        height={(layout.height * width) / layout.width}
        viewBox={`0 0 ${layout.width} ${layout.height}`}
        onLayout={() => {
          const current = svg.current;
          if (current) onReady(() => captureReferralImage(current, layout));
        }}
        accessibilityLabel="Formatted referral image. The text preview contains the same information."
        accessibilityHint="Use Back to text preview for selectable and screen-reader-readable content"
      >
        <Rect
          x={0}
          y={0}
          width={layout.width}
          height={layout.height}
          fill="white"
        />
        {layout.lines.map((line) => (
          <SvgText
            key={`${line.x}:${line.y}`}
            x={line.x}
            y={line.y}
            fontSize={line.fontSize}
            fontWeight={line.fontWeight}
            fontStyle={line.fontStyle}
            fill={line.color ?? '#172b40'}
          >
            {line.text}
          </SvgText>
        ))}
      </Svg>
    </View>
  );
}
