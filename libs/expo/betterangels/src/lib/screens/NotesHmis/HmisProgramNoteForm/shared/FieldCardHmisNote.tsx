import {
  Colors,
  Spacings,
  TMarginProps,
  getMarginStyles,
} from '@monorepo/expo/shared/static';
import { TextMedium, TextRegular } from '@monorepo/expo/shared/ui-components';
import { ReactNode } from 'react';
import { DimensionValue, StyleSheet, View } from 'react-native';
import { FieldCardHmisNoteWrapper } from './FieldCardHmisNoteWrapper';

function renderActionName(val: string | ReactNode) {
  if (typeof val === 'string') {
    return <TextMedium size="sm">{val}</TextMedium>;
  }

  return val;
}

interface IFieldCardProps extends TMarginProps {
  children?: ReactNode;
  title: string;
  actionName: string | ReactNode;
  value?: string;
  disabled?: boolean;
  required?: boolean;
  error?: string | undefined;
  expanded?: boolean;
  onPress: () => void;
  childHeight?: DimensionValue | undefined;
  overflow?: 'hidden' | 'visible' | 'scroll' | undefined;
}

export function FieldCardHmisNote(props: IFieldCardProps) {
  const {
    children,
    value,
    title,
    actionName,
    disabled,
    required,
    error,
    expanded,
    onPress,
    childHeight,
    overflow = 'hidden',
  } = props;

  return (
    <FieldCardHmisNoteWrapper
      expanded={expanded}
      onPress={onPress}
      title={title}
      error={error}
      style={{
        ...getMarginStyles(props),
        opacity: disabled ? 0.5 : 1,
      }}
    >
      <View style={[styles.header]}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          {!expanded && <TextRegular size="sm">{title}</TextRegular>}
          {!!expanded && <TextMedium size="lg">{title}</TextMedium>}
          {required && (
            <TextRegular color={Colors.ERROR} ml="xxs">
              *
            </TextRegular>
          )}
        </View>
        {!expanded && !value && <View>{renderActionName(actionName)}</View>}
      </View>

      {error && (
        <TextRegular mt="xs" color={Colors.ERROR}>
          {error}
        </TextRegular>
      )}

      {!expanded && !!value && <TextRegular mt="md">{value}</TextRegular>}

      {!!expanded && (
        <View
          style={{
            height: childHeight,
            overflow,
            marginTop: expanded ? Spacings.sm : Spacings.md,
            marginBottom: expanded ? Spacings.md : 0,
          }}
        >
          {children}
        </View>
      )}
    </FieldCardHmisNoteWrapper>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: Spacings.xs,
  },
});
