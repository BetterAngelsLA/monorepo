import { Colors } from '@monorepo/expo/shared/static';
import { TextBold, TextRegular } from '@monorepo/expo/shared/ui-components';
import { Pressable, TextInput, View } from 'react-native';
import { MemoryIcon } from './IntakeFieldMarkers';
import { GREEN, RED, styles } from './intakeFormStyles';
import type {
  IntakeAnswers,
  IntakeControlValue,
  IntakeFieldDefinition,
  IntakeFieldKey,
} from './intakeFields';

type FormField = IntakeFieldDefinition & { key: IntakeFieldKey };

export function Field({
  f,
  value,
  onChange,
}: {
  f: FormField;
  value: IntakeAnswers[IntakeFieldKey];
  onChange: (v: IntakeControlValue) => void;
}) {
  return (
    <View style={[styles.field, f.sensitive && styles.fieldSensitive]}>
      <View style={styles.fieldHead}>
        <View style={styles.fieldLabelRow}>
          <TextBold size="sm">{f.label}</TextBold>
          {f.requirement !== 'optional' && (
            <TextRegular size="xs" color={Colors.ERROR}>
              *
            </TextRegular>
          )}
        </View>
        <View style={styles.fieldMarkers}>
          {f.backend.mode === 'unmapped' ? (
            <TextRegular size="xs" color={Colors.NEUTRAL}>
              Not submitted
            </TextRegular>
          ) : (
            <MemoryIcon color={f.backend.mode === 'direct' ? GREEN : RED} />
          )}
        </View>
      </View>

      {f.help && (
        <TextRegular size="xs" color={Colors.NEUTRAL} style={styles.help}>
          {f.help}
        </TextRegular>
      )}

      <Control f={f} value={value} onChange={onChange} />
    </View>
  );
}

export function Control({
  f,
  value,
  onChange,
}: {
  f: FormField;
  value: IntakeAnswers[IntakeFieldKey];
  onChange: (v: IntakeControlValue) => void;
}) {
  if (f.control === 'yesno') {
    return (
      <View style={styles.chips}>
        {['Yes', 'No'].map((opt) => {
          const on = value === opt;
          return (
            <Pressable
              key={opt}
              testID={`${f.key}-${opt.toLowerCase()}-btn`}
              onPress={() => onChange(opt)}
              style={[styles.chip, on && styles.chipOn]}
              accessibilityRole="radio"
              accessibilityState={{ selected: on }}
            >
              <TextRegular
                size="xs"
                color={on ? Colors.WHITE : Colors.NEUTRAL_DARK}
              >
                {opt}
              </TextRegular>
            </Pressable>
          );
        })}
      </View>
    );
  }

  if (f.control === 'multiselect') {
    // Same chip vocabulary as yes/no, but toggling and multi-valued: the shelter
    // stores these as lists, so the client side has to be able to say "cats and
    // a service animal" rather than just "pets: yes".
    const selected: readonly string[] = Array.isArray(value) ? value : [];
    return (
      <View style={styles.chips}>
        {f.options.map((opt) => {
          const on = selected.includes(opt.value);
          return (
            <Pressable
              key={opt.value}
              testID={`${f.key}-${opt.value}-btn`}
              onPress={() =>
                onChange(
                  on
                    ? selected.filter((v) => v !== opt.value)
                    : [...selected, opt.value],
                )
              }
              style={[styles.chip, on && styles.chipOn]}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: on }}
              accessibilityLabel={opt.label}
              accessibilityHint={`toggles ${opt.label} for ${f.label}`}
            >
              <TextRegular
                size="xs"
                color={on ? Colors.WHITE : Colors.NEUTRAL_DARK}
              >
                {opt.label}
              </TextRegular>
            </Pressable>
          );
        })}
      </View>
    );
  }

  if (f.control === 'checkbox') {
    const checked = value === true;
    return (
      <Pressable
        style={styles.checkboxRow}
        onPress={() => onChange(!checked)}
        accessibilityRole="checkbox"
        accessibilityState={{ checked }}
      >
        <View style={[styles.checkbox, checked && styles.checkboxOn]}>
          {checked && (
            <TextRegular size="xs" color={Colors.WHITE}>
              ✓
            </TextRegular>
          )}
        </View>
        <TextRegular size="xs" color={Colors.NEUTRAL_DARK}>
          {f.checkboxLabel}
        </TextRegular>
      </Pressable>
    );
  }

  // text | textarea
  return (
    <TextInput
      testID={`intake-${f.key}-input`}
      style={[styles.input, f.control === 'textarea' && styles.textarea]}
      multiline={f.control === 'textarea'}
      placeholder="Enter…"
      placeholderTextColor={Colors.NEUTRAL}
      value={typeof value === 'string' ? value : ''}
      onChangeText={onChange}
      accessibilityLabel={f.label}
      accessibilityHint={f.help ?? `enter ${f.label}`}
    />
  );
}
