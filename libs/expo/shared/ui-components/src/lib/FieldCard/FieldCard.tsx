import { ErrorMessage } from '@hookform/error-message';
import { Colors, Radiuses, Spacings } from '@monorepo/expo/shared/static';
import { ReactNode, RefObject, useEffect, useState } from 'react';
import { FieldErrors } from 'react-hook-form';
import {
  DimensionValue,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import TextMedium from '../TextMedium';
import TextRegular from '../TextRegular';

type TSpacing = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

interface IFieldCardProps {
  children: ReactNode;
  title: string;
  actionName: ReactNode;
  required?: boolean;
  mb?: TSpacing;
  mt?: TSpacing;
  my?: TSpacing;
  mx?: TSpacing;
  ml?: TSpacing;
  mr?: TSpacing;
  error?: string | undefined;
  errors?: FieldErrors;
  errorNames?: string[];
  expanded: string | undefined | null;
  setExpanded: () => void;
  info?: ReactNode;
  childHeight?: DimensionValue | undefined;
  scrollRef?: RefObject<ScrollView>;
  overflow?: 'hidden' | 'visible' | 'scroll' | undefined;
}

export function FieldCard(props: IFieldCardProps) {
  const {
    children,
    title,
    mb,
    mt,
    mr,
    ml,
    my,
    mx,
    actionName,
    required,
    error,
    errors,
    errorNames,
    expanded,
    setExpanded,
    info,
    childHeight,
    scrollRef,
    overflow = 'hidden',
  } = props;
  const [place, setPlace] = useState<null | number>(null);

  const scrollToElement = () => {
    if (!place || !scrollRef) return;

    scrollRef.current?.scrollTo({
      x: 0,
      y: place,
      animated: true,
    });
  };

  useEffect(() => {
    if (!place) return;
    scrollToElement();
  }, [place]);

  return (
    <Pressable
      onPress={() => {
        setExpanded();
      }}
      onLayout={(event) => {
        const layout = event.nativeEvent.layout;
        expanded === title && scrollRef
          ? setTimeout(() => {
              setPlace(layout.y);
            }, 300)
          : setPlace(null);
      }}
      accessible
      accessibilityRole="button"
      accessibilityHint={`expands ${title} field`}
      style={({ pressed }) => [
        styles.container,
        {
          marginBottom: mb && Spacings[mb],
          marginTop: mt && Spacings[mt],
          marginLeft: ml && Spacings[ml],
          marginRight: mr && Spacings[mr],
          marginHorizontal: mx && Spacings[mx],
          marginVertical: my && Spacings[my],
          backgroundColor: pressed ? Colors.GRAY_PRESSED : Colors.WHITE,
          borderColor:
            !!error && expanded !== title ? Colors.ERROR : Colors.NEUTRAL_LIGHT,
        },
      ]}
    >
      <View style={[styles.header]}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          {expanded === title ? (
            <TextMedium size="lg">{title}</TextMedium>
          ) : (
            <TextRegular size="sm">{title}</TextRegular>
          )}
          {required && <TextRegular color={Colors.ERROR}>*</TextRegular>}
          {info && info}
        </View>
        {actionName}
      </View>
      {errors &&
        errorNames?.map((fieldName) => (
          <ErrorMessage
            key={fieldName}
            name={fieldName}
            errors={errors}
            render={({ messages }) =>
              messages &&
              Object.entries(messages).map(([type, message]) => {
                return (
                  <TextRegular mt="xs" color={Colors.ERROR} key={type}>
                    {message}
                  </TextRegular>
                );
              })
            }
          />
        ))}
      <View
        onStartShouldSetResponder={() => true}
        style={{
          height: childHeight,
          overflow,
          marginTop: expanded === title ? Spacings.sm : Spacings.md,
          marginBottom: expanded === title ? Spacings.md : 0,
        }}
      >
        {children}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacings.sm,
    borderRadius: Radiuses.xs,
    backgroundColor: Colors.WHITE,
    borderWidth: 1,
  },
  header: {
    paddingTop: Spacings.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    rowGap: Spacings.sm,
  },
});
