import { ChevronLeftIcon, WFEdit } from '@monorepo/expo/shared/icons';
import { Colors, Spacings } from '@monorepo/expo/shared/static';
import {
  ExpandableContainer,
  TextRegular,
} from '@monorepo/expo/shared/ui-components';
import { ReactElement } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { ClientProfileCardEnum, ClientProfileCardTitles } from './constants';

type TProps = {
  card: ClientProfileCardEnum;
  openCard: ClientProfileCardEnum | null;
  children: ReactElement;
  onOpenCloseClick: (card: ClientProfileCardEnum) => void;
  onEditClick: (card: ClientProfileCardEnum) => void;
};

export function ExpandableProfileContainer(props: TProps) {
  const { card, onEditClick, onOpenCloseClick, openCard, children } = props;

  const isOpen = openCard === card;

  const header = (
    <Header
      card={card}
      isOpen={isOpen}
      onOpenCloseClick={() => onOpenCloseClick(card)}
      onEditClick={() => onEditClick(card)}
    />
  );

  return (
    <ExpandableContainer disabled isOpen={isOpen} header={header}>
      {children}
    </ExpandableContainer>
  );
}

type THeader = {
  card: ClientProfileCardEnum;
  isOpen?: boolean;
  onOpenCloseClick: () => void;
  onEditClick: () => void;
};

function Header(props: THeader) {
  const { card, isOpen, onEditClick, onOpenCloseClick } = props;

  const title = ClientProfileCardTitles[card];

  return (
    <View style={styles.container}>
      <TextRegular
        size={isOpen ? 'md' : 'sm'}
        style={StyleSheet.flatten([
          styles.titleText,
          isOpen ? styles.titleTextOpen : null,
        ])}
      >
        {title}
      </TextRegular>

      {isOpen && <EditButton onClick={onEditClick} />}

      <OpenCloseButton
        isOpen={!!isOpen}
        title={title}
        onClick={onOpenCloseClick}
      />
    </View>
  );
}

type TEditButton = {
  onClick: () => void;
};

function EditButton(props: TEditButton) {
  const { onClick } = props;
  return (
    <Pressable
      onPress={onClick}
      accessible
      accessibilityRole="button"
      style={({ pressed }) => [
        {
          backgroundColor: pressed ? Colors.GRAY_PRESSED : undefined,
          marginLeft: Spacings.xs,
          ...styles.button,
        },
      ]}
    >
      <WFEdit size="sm" />
    </Pressable>
  );
}

type TOpenCloseButton = {
  title: string;
  isOpen: boolean;
  onClick: () => void;
};

function OpenCloseButton(props: TOpenCloseButton) {
  const { title, isOpen, onClick } = props;

  const accessibilityHint = isOpen
    ? `close ${title} section`
    : `open ${title} section`;

  return (
    <Pressable
      onPress={onClick}
      accessible
      accessibilityRole="button"
      accessibilityHint={accessibilityHint}
      style={({ pressed }) => [
        {
          backgroundColor: pressed ? Colors.GRAY_PRESSED : undefined,
          marginLeft: 'auto',
          ...styles.button,
        },
      ]}
    >
      <ChevronLeftIcon size="sm" rotate={isOpen ? '90deg' : '-90deg'} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  titleText: {
    flexShrink: 1,
    paddingVertical: Spacings.sm,
  },
  titleTextOpen: {
    fontFamily: 'Poppins-SemiBold',
  },
  button: {
    width: Spacings.xl,
    height: Spacings.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
