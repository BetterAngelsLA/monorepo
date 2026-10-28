import { CheckIcon } from '@monorepo/expo/shared/icons';
import { Colors, Radiuses, Spacings } from '@monorepo/expo/shared/static';
import {
  Avatar,
  PickerField,
  SearchListBar,
  TextBold,
  TextRegular,
} from '@monorepo/expo/shared/ui-components';
import { useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { formatMemberName } from '../../util/formatMemberName';

export type TAssignableMember = {
  id: string;
  firstName?: string | null;
  lastName?: string | null;
};

type TProps = {
  label?: string;
  placeholder?: string;
  items: TAssignableMember[];
  selectedValue: string | null;
  onChange: (value: string | null) => void;
  disabled?: boolean;
  error?: string;
  testId?: string;
  /** True while the roster is in flight. */
  loading?: boolean;
  /** The roster request failed; surfaced instead of an empty list. */
  loadError?: boolean;
  /**
   * The current assignee, when the roster does not contain them — someone who
   * left the organization. Keeps the field showing a name instead of looking
   * unassigned while the id is still set.
   */
  selectedFallback?: TAssignableMember | null;
  /** Called the first time the sheet opens, so the roster can load lazily. */
  onOpen?: () => void;
  /** Override for surfaces that call the roster something else (HMIS). */
  searchPlaceholder?: string;
};

/**
 * Single-select picker for a task's assignee.
 *
 * The org roster can run to every caseworker in the LA team, so this is a
 * searchable sheet rather than the plain `SingleSelect` list: a title, the same
 * search bar the client pickers use, and one avatar row per member. Tapping a
 * row picks it and closes — one decision, no confirm step.
 *
 * Filtering is local: `taskAssignees` already returns the whole roster (the
 * query takes a high limit), so a round-trip per keystroke would buy nothing.
 */
export function AssigneeSelect(props: TProps) {
  const {
    label,
    placeholder = 'Select assignee',
    items,
    selectedValue,
    onChange,
    disabled,
    error,
    testId,
    loading = false,
    loadError = false,
    selectedFallback = null,
    onOpen: onOpenProp,
    searchPlaceholder = 'Search name',
  } = props;

  const [isOpen, setIsOpen] = useState(false);

  // The roster wins; the fallback only fills in an id the roster no longer has.
  const withFallback = useMemo(() => {
    if (
      !selectedFallback ||
      items.some((member) => member.id === selectedFallback.id)
    ) {
      return items;
    }

    return [selectedFallback, ...items];
  }, [items, selectedFallback]);

  const pickerItems = useMemo(
    () =>
      withFallback.map((member) => ({
        value: member.id,
        displayValue: formatMemberName(member),
      })),
    [withFallback],
  );

  // Seeded by `SearchListBar`, which re-emits its filtered list whenever the
  // roster changes (`useTextFilter` depends on `data`). Resetting it here as
  // well would clobber an in-progress search: the box keeps the typed text
  // while the list silently reverts to everyone.
  const [filtered, setFiltered] = useState<TAssignableMember[]>([]);

  const close = () => setIsOpen(false);

  const open = () => {
    if (disabled) return;

    onOpenProp?.();

    // Start from the full roster: a stale query from the last open would hide
    // the very member the user came back to pick.
    setFiltered(withFallback);
    setIsOpen(true);
  };

  const select = (id: string | null) => {
    onChange(id);
    close();
  };

  return (
    <>
      <PickerField
        testId={testId}
        label={label}
        error={error}
        disabled={disabled}
        placeholder={placeholder}
        selectedValue={selectedValue}
        items={pickerItems}
        onOpen={open}
        onClear={() => onChange(null)}
      />

      <Modal
        visible={isOpen}
        transparent
        animationType="fade"
        statusBarTranslucent
        presentationStyle="overFullScreen"
        onRequestClose={close}
      >
        <View style={styles.fullscreen}>
          <Pressable
            style={styles.backdrop}
            onPress={close}
            accessibilityLabel="Close assignee picker"
            accessibilityHint="Closes the assignee picker"
          />

          <View style={styles.centerWrap}>
            <SafeAreaView style={styles.content}>
              <View style={styles.header}>
                <TextRegular size="sm" color={Colors.NEUTRAL_DARK}>
                  {label ?? 'Assignee'}
                </TextRegular>
                <SearchListBar
                  // `withFallback`, not `items`: the bar re-emits its own
                  // filtered list on mount, so handing it the raw roster
                  // dropped a current assignee who has left the org — the row
                  // the field is rendering by name.
                  data={withFallback}
                  extractSearchText={(member) => formatMemberName(member)}
                  onChange={setFiltered}
                  placeholder={searchPlaceholder}
                />
              </View>

              <ScrollView
                contentContainerStyle={styles.list}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
              >
                {filtered.map((member) => {
                  const name = formatMemberName(member);

                  return (
                    <MemberRow
                      key={member.id}
                      label={name}
                      isSelected={member.id === selectedValue}
                      onPress={() => select(member.id)}
                    />
                  );
                })}

                {!filtered.length && (
                  <TextRegular size="sm" style={styles.empty}>
                    {loadError
                      ? "Couldn't load your organization's members."
                      : loading
                        ? 'Loading members…'
                        : withFallback.length
                          ? 'No members match that name.'
                          : 'No members to assign in this organization.'}
                  </TextRegular>
                )}
              </ScrollView>
            </SafeAreaView>
          </View>
        </View>
      </Modal>
    </>
  );
}

type TMemberRowProps = {
  label: string;
  isSelected: boolean;
  onPress: () => void;
};

function MemberRow(props: TMemberRowProps) {
  const { label, isSelected, onPress } = props;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: isSelected }}
      accessibilityLabel={label}
      accessibilityHint={
        isSelected ? 'The current assignee' : 'Assign the task to this member'
      }
      style={({ pressed }) => [
        styles.row,
        pressed && { backgroundColor: Colors.NEUTRAL_EXTRA_LIGHT },
      ]}
    >
      <Avatar
        mr="xs"
        size="sm"
        accessibilityLabel={`${label} profile photo`}
        accessibilityHint={`${label} profile photo`}
        imageUrl={''}
      />
      <View style={styles.name}>
        {isSelected ? (
          <TextBold size="sm">{label}</TextBold>
        ) : (
          <TextRegular size="sm">{label}</TextRegular>
        )}
      </View>
      {isSelected && <CheckIcon size="sm" color={Colors.PRIMARY_EXTRA_DARK} />}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fullscreen: {
    flex: 1,
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  centerWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacings.md,
    pointerEvents: 'box-none',
  },
  content: {
    width: '100%',
    maxHeight: '70%',
    backgroundColor: Colors.WHITE,
    borderRadius: Radiuses.xs,
    overflow: 'hidden',
  },
  header: {
    gap: Spacings.xs,
    paddingHorizontal: Spacings.sm,
    paddingTop: Spacings.sm,
    paddingBottom: Spacings.xs,
  },
  list: {
    paddingHorizontal: Spacings.sm,
    paddingBottom: Spacings.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacings.xs,
    paddingVertical: Spacings.sm,
    borderRadius: Radiuses.xs,
  },
  name: {
    flex: 1,
  },
  empty: {
    paddingVertical: Spacings.sm,
  },
});
