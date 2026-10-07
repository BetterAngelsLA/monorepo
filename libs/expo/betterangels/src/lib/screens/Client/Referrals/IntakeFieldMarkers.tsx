import { TextRegular } from '@monorepo/expo/shared/ui-components';
import { View } from 'react-native';
import Svg, { Ellipse, Path } from 'react-native-svg';
import { RED, styles } from './intakeFormStyles';

/** Database marker: dedicated field or temporary storage with referral notes. */
export function MemoryIcon({ color }: { color: string }) {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
      <Ellipse
        cx={12}
        cy={6}
        rx={7}
        ry={2.7}
        stroke={color}
        strokeWidth={1.4}
      />
      <Path
        d="M5 6v12c0 1.5 3.1 2.7 7 2.7s7-1.2 7-2.7V6"
        stroke={color}
        strokeWidth={1.4}
        strokeLinecap="round"
      />
      <Path
        d="M5 12c0 1.5 3.1 2.7 7 2.7s7-1.2 7-2.7"
        stroke={color}
        strokeWidth={1.4}
        strokeLinecap="round"
      />
    </Svg>
  );
}

/** Small red outline "PII" tag for personally-identifying fields. */
export function PiiTag() {
  return (
    <View style={styles.piiTag}>
      <TextRegular size="xs" color={RED}>
        PII
      </TextRegular>
    </View>
  );
}
