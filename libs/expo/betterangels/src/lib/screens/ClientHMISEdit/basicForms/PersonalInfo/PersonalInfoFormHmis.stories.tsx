import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { zodResolver } from '@hookform/resolvers/zod';
import { FormProvider, useForm } from 'react-hook-form';
import { View, ScrollView, StyleSheet } from 'react-native';
import {
  HmisDobQualityEnum,
  HmisVeteranStatusEnum,
  LanguageEnum,
  LivingSituationEnum,
} from '../../../../apollo';
import { PersonalInfoFormHmis } from './PersonalInfoFormHmis';
import {
  PersonalInfoFormSchema,
  personalInfoFormEmptyState,
  TPersonalInfoFormSchema,
} from './formSchema';

// Wrapper component that provides the form context
function PersonalInfoFormWrapper({
  initialValues,
}: {
  initialValues?: Partial<TPersonalInfoFormSchema>;
}) {
  const methods = useForm<TPersonalInfoFormSchema>({
    resolver: zodResolver(PersonalInfoFormSchema),
    defaultValues: {
      ...personalInfoFormEmptyState,
      ...initialValues,
    },
  });

  return (
    <FormProvider {...methods}>
      <ScrollView style={styles.container}>
        <View style={styles.formContainer}>
          <PersonalInfoFormHmis />
        </View>
      </ScrollView>
    </FormProvider>
  );
}

const meta: Meta<typeof PersonalInfoFormWrapper> = {
  title: 'RN Components/Forms/PersonalInfoFormHmis',
  component: PersonalInfoFormWrapper,
  parameters: {
    docs: {
      description: {
        component:
          'HMIS Personal Info form with DatePicker. Test the clear button by selecting a date - it should appear when a date is selected.',
      },
    },
  },
};

export default meta;

type Story = StoryObj<typeof PersonalInfoFormWrapper>;

export const Empty: Story = {
  args: {
    initialValues: personalInfoFormEmptyState,
  },
};

export const WithDate: Story = {
  args: {
    initialValues: {
      ...personalInfoFormEmptyState,
      birthDate: new Date('1990-01-15'),
    },
  },
  parameters: {
    docs: {
      description: {
        story:
          'Form with a date selected. The DatePicker should show a clear button (X icon) that allows clearing the date.',
      },
    },
  },
};

export const WithAllFields: Story = {
  args: {
    initialValues: {
      ...personalInfoFormEmptyState,
      birthDate: new Date('1985-05-20'),
      californiaId: 'A1234567',
      dobQuality: HmisDobQualityEnum.Full,
      veteran: HmisVeteranStatusEnum.Yes,
      livingSituation: LivingSituationEnum.Housing,
      preferredLanguage: LanguageEnum.English,
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Form with all fields filled out. Test clearing the date field.',
      },
    },
  },
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  formContainer: {
    padding: 16,
    maxWidth: 600,
    alignSelf: 'center',
    width: '100%',
  },
});
