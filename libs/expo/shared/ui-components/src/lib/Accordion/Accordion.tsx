import { ChevronLeftIcon } from '@monorepo/expo/shared/icons';
import { Colors, Spacings } from '@monorepo/expo/shared/static';
import { ReactNode, RefObject, useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import TextMedium from '../TextMedium';
import TextRegular from '../TextRegular';

type TSpacing = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

interface IAccordionProps {
  children: ReactNode;
  title: string;
  mb?: TSpacing;
  mt?: TSpacing;
  my?: TSpacing;
  mx?: TSpacing;
  ml?: TSpacing;
  mr?: TSpacing;
  expanded: string | undefined | null;
  setExpanded: () => void;
  scrollRef?: RefObject<ScrollView>;
  bg?: string;
  borderWidth?: number;
  borderRadius?: number;
  borderColor?: string;
  icon?: ReactNode;
}

export function Accordion(props: IAccordionProps) {
  const {
    children,
    title,
    mb,
    mt,
    mr,
    ml,
    my,
    mx,
    expanded,
    setExpanded,
    scrollRef,
    bg = Colors.NEUTRAL_EXTRA_LIGHT,
    borderWidth,
    borderRadius,
    borderColor,
    icon,
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
    <View
      onLayout={(event) => {
        const layout = event.nativeEvent.layout;
        expanded === title && scrollRef
          ? setTimeout(() => {
              setPlace(layout.y);
            }, 300)
          : setPlace(null);
      }}
    >
      <Pressable
        onPress={() => {
          setExpanded();
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
            backgroundColor: pressed ? Colors.GRAY_PRESSED : bg,
            borderWidth,
            borderRadius,
            borderColor,
          },
        ]}
      >
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: Spacings.xs,
          }}
        >
          {icon}
          {expanded === title ? (
            <TextMedium size="md">{title}</TextMedium>
          ) : (
            <TextRegular size="sm">{title}</TextRegular>
          )}
        </View>
        <ChevronLeftIcon
          size="sm"
          rotate={expanded === title ? '90deg' : '-90deg'}
        />
      </Pressable>
      <View onStartShouldSetResponder={() => true}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacings.xs,
    paddingVertical: Spacings.sm,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexDirection: 'row',
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
