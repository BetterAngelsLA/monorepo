import * as Clipboard from 'expo-clipboard';
import { Linking } from 'react-native';
import openMap from 'react-native-open-maps';
import { TContactActionItem } from './ContactActionMenu';

type TAddress = {
  street?: string | null;
  city?: string | null;
  state?: string | null;
  zipCode?: string | null;
};

type TFeedback = {
  showSnackbar: (opts: { message: string; type: 'success' | 'error' }) => void;
};

async function copyToClipboard(text: string, feedback: TFeedback, label: string) {
  try {
    await Clipboard.setStringAsync(text);
    feedback.showSnackbar({ message: `${label} copied`, type: 'success' });
  } catch (err) {
    console.error('Failed to copy to clipboard', err);
    feedback.showSnackbar({
      message: `Failed to copy ${label.toLowerCase()}`,
      type: 'error',
    });
  }
}

async function openExternalUrl(url: string, feedback: TFeedback, failureMsg: string) {
  try {
    await Linking.openURL(url);
  } catch (err) {
    console.error(`Failed to open ${url}`, err);
    feedback.showSnackbar({ message: failureMsg, type: 'error' });
  }
}

export function getAddressActions(
  address: string | TAddress,
  feedback: TFeedback
): TContactActionItem[] {
  const fullAddress =
    typeof address === 'string'
      ? address
      : [address?.street, address?.city, address?.state, address?.zipCode]
          .filter(Boolean)
          .join(', ');

  return [
    {
      action: 'copy',
      label: 'Copy address',
      onPress: () => copyToClipboard(fullAddress, feedback, 'Address'),
    },
    {
      action: 'openInAppleMaps',
      label: 'Open in Apple Maps',
      onPress: () =>
        openMap({
          query: fullAddress,
          provider: 'apple',
          travelType: 'drive',
        }),
    },
    {
      action: 'openInGoogleMaps',
      label: 'Open in Google Maps',
      onPress: () =>
        openMap({
          query: fullAddress,
          provider: 'google',
          travelType: 'drive',
        }),
    },
  ];
}

export function getPhoneActions(
  displayNumber: string,
  dialNumber: string,
  feedback: TFeedback
): TContactActionItem[] {
  return [
    {
      action: 'copy',
      label: 'Copy phone number',
      onPress: () => copyToClipboard(displayNumber, feedback, 'Phone number'),
    },
    {
      action: 'call',
      label: 'Call',
      onPress: () =>
        openExternalUrl(
          `tel:${dialNumber}`,
          feedback,
          'Unable to place call'
        ),
    },
  ];
}

export function getEmailActions(
  email: string,
  feedback: TFeedback
): TContactActionItem[] {
  return [
    {
      action: 'copy',
      label: 'Copy email address',
      onPress: () => copyToClipboard(email, feedback, 'Email address'),
    },
    {
      action: 'sendEmail',
      label: 'Send email',
      onPress: () =>
        openExternalUrl(
          `mailto:${email}`,
          feedback,
          'Unable to open email client'
        ),
    },
  ];
}
