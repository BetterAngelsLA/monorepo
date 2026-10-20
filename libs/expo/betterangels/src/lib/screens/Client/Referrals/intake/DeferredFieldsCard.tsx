import { Colors } from '@monorepo/expo/shared/static';
import { TextBold, TextRegular } from '@monorepo/expo/shared/ui-components';
import { useState } from 'react';
import { Pressable, View } from 'react-native';
import {
  DEFERRED_FIELD_COUNT,
  DEFERRED_SMARTSHEET_FIELDS,
} from './deferredSmartsheetFields';
import { styles } from './intakeFormStyles';

/**
 * Reference-only: the deferred Smartsheet superset, collapsed. Not collected and
 * not wired to anything — it exists so the team/testers can see how much of the
 * Phase-1 intake this form intentionally leaves out (GAP-02 / GAP-13).
 */
export function DeferredFieldsCard() {
  const [open, setOpen] = useState(false);
  return (
    <View style={styles.deferredCard}>
      <Pressable
        style={styles.deferredHead}
        onPress={() => setOpen((v) => !v)}
        accessibilityRole="button"
        accessibilityLabel="other Smartsheet fields, not collected"
        accessibilityHint="expands the list of deferred Smartsheet fields"
        accessibilityState={{ expanded: open }}
      >
        <View style={styles.deferredTitleWrap}>
          <TextBold size="sm" color={Colors.NEUTRAL_DARK}>
            Other Smartsheet fields
          </TextBold>
          <TextRegular size="xs" color={Colors.NEUTRAL}>
            {`${DEFERRED_FIELD_COUNT} fields · not collected`}
          </TextRegular>
        </View>
        <TextRegular size="sm" color={Colors.NEUTRAL}>
          {open ? '▾' : '▸'}
        </TextRegular>
      </Pressable>

      {open && (
        <View style={styles.deferredBody}>
          <TextRegular size="xs" color={Colors.NEUTRAL} style={styles.help}>
            Reference only — the rest of the Phase-1 Smartsheet intake, deferred
            and unratified (GAP-02 / GAP-13). The required section above is a
            small slice of this; a few items (Pets, DV, accommodations) appear
            there in simplified form.
          </TextRegular>
          {DEFERRED_SMARTSHEET_FIELDS.map((group) => (
            <View key={group.section} style={styles.deferredGroup}>
              <TextBold size="xs" color={Colors.NEUTRAL_DARK}>
                {group.section}
              </TextBold>
              <TextRegular
                size="xs"
                color={Colors.NEUTRAL}
                style={styles.deferredList}
              >
                {group.fields.join('  ·  ')}
              </TextRegular>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}
