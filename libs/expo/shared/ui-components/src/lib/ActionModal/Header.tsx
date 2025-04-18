import { Spacings } from '@monorepo/expo/shared/static';
import { View } from 'react-native';
import TextBold from '../TextBold';

export default function ActionModalHeader({
  title,
  subtitle,
}: {
  title?: string;
  subtitle?: string;
}) {
  if (!title && !subtitle) {
    return null;
  }

  return (
    <View style={{ gap: Spacings.xxs }}>
      {title && <TextBold size="xs">{title}</TextBold>}
      {subtitle && <TextBold size="lg">{subtitle}</TextBold>}
    </View>
  );
}
