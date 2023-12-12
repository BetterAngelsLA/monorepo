import { MainScrollContainer } from '@monorepo/expo/betterangels';
import {
  BullseyeIcon,
  CalendarIcon,
  ImageIcon,
  LocationDotIcon,
  MicrophoneIcon,
  NoteIcon,
  PaperclipIcon,
  PlusIcon,
  VideoIcon,
} from '@monorepo/expo/shared/icons';
import { Colors, Spacings } from '@monorepo/expo/shared/static';
import {
  BodyText,
  Button,
  FieldCard,
  H2,
  H3,
  Textarea,
} from '@monorepo/expo/shared/ui-components';
import { useLocalSearchParams } from 'expo-router';
import React from 'react';
import { useForm } from 'react-hook-form';
import { Pressable, StyleSheet, View } from 'react-native';

export default function AddNote() {
  const { clientId } = useLocalSearchParams<{ clientId: string }>();
  const { control } = useForm();

  console.log(clientId);

  return (
    <MainScrollContainer bg={Colors.NEUTRAL_LIGHT} pt="sm">
      <H2 mb="lg">Log your session</H2>
      <BodyText mb="xl">
        Log session details, including location, purpose, interventions, and
        plans for the next session, for concise and organized record-keeping.
      </BodyText>
      <FieldCard
        mb="xs"
        Icon={NoteIcon}
        onPress={() => console.log('note')}
        title="Note Title"
      >
        <BodyText>Meeting with Jose on 12/1/23 at 9AM</BodyText>
      </FieldCard>
      <FieldCard
        mb="xs"
        Icon={CalendarIcon}
        onPress={() => console.log('note')}
        title="Date and Time"
      >
        <BodyText>12/1/23 at 9AM</BodyText>
      </FieldCard>
      <FieldCard
        mb="xs"
        Icon={LocationDotIcon}
        onPress={() => console.log('note')}
        title="Location"
      >
        <BodyText>123 Wilshire Blvd</BodyText>
      </FieldCard>
      <FieldCard
        mb="xs"
        Icon={BullseyeIcon}
        onPress={() => console.log('note')}
        title="Purposes"
      >
        <View>
          <BodyText mb="sm">Conduct wellness check</BodyText>
          <BodyText>Update re: Housing Referral</BodyText>
        </View>
      </FieldCard>
      <FieldCard
        mb="lg"
        Icon={BullseyeIcon}
        onPress={() => console.log('note')}
        title="Planning"
      />
      <H3 mb="sm">Public Note for HMIS</H3>
      <Textarea
        mb="sm"
        label="How was ... today?"
        name="feeling"
        control={control}
      />
      <View style={styles.iconsContainer}>
        <Pressable
          accessible
          accessibilityHint=""
          accessibilityRole="button"
          style={styles.icon}
        >
          <MicrophoneIcon color={Colors.PRIMARY_EXTRA_DARK} />
        </Pressable>
        <Pressable
          accessibilityRole="button"
          style={[styles.icon, { marginHorizontal: Spacings.xs }]}
        >
          <PaperclipIcon color={Colors.PRIMARY_EXTRA_DARK} />
        </Pressable>
        <Pressable
          accessibilityRole="button"
          style={[styles.icon, { marginRight: Spacings.xs }]}
        >
          <ImageIcon color={Colors.PRIMARY_EXTRA_DARK} />
        </Pressable>
        <Pressable accessibilityRole="button" style={styles.icon}>
          <VideoIcon color={Colors.PRIMARY_EXTRA_DARK} />
        </Pressable>
      </View>
      <Button
        mb="lg"
        size="full"
        variant="secondary"
        icon={<PlusIcon size="sm" color={Colors.PRIMARY_EXTRA_DARK} />}
        title="Add Private Note (Optional)"
      />
      <Button variant="primary" size="full" title="Save" />
    </MainScrollContainer>
  );
}

const styles = StyleSheet.create({
  iconsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginBottom: Spacings.lg,
  },
  icon: {
    padding: Spacings.xs,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.NEUTRAL,
  },
});
